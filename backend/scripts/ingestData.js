/**
 * Data ingestion script for MİZAN AI
 *
 * Attempts to fetch legal cases from HuggingFace datasets API first,
 * falls back to local sampleCases.json on failure.
 *
 * Usage: npm run ingest
 */

require('dotenv').config();

const { pool, initializeDatabase } = require('../src/config/database');
const { embedText } = require('../src/services/embeddingService');
const path = require('path');

const HUGGINGFACE_API_URL =
  'https://datasets-server.huggingface.co/rows?dataset=turkish_legal_cases&config=default&split=train&offset=0&length=100';

/**
 * Attempt to fetch cases from HuggingFace datasets API
 * @returns {Promise<Array|null>} Array of cases or null on failure
 */
const fetchFromHuggingFace = async () => {
  try {
    console.log('HuggingFace API\'den veri çekilmeye çalışılıyor...');

    const response = await fetch(HUGGINGFACE_API_URL, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API ${response.status} hatası döndü.`);
    }

    const data = await response.json();

    if (!data.rows || data.rows.length === 0) {
      throw new Error('HuggingFace API boş veri döndü.');
    }

    // Map HuggingFace data to our schema
    const cases = data.rows.map((row) => ({
      case_number: row.row?.case_number || row.row?.esas_no || null,
      court: row.row?.court || row.row?.mahkeme || 'Belirtilmemiş',
      decision_number: row.row?.decision_number || row.row?.karar_no || null,
      decision_date: row.row?.decision_date || row.row?.karar_tarihi || null,
      subject: row.row?.subject || row.row?.konu || null,
      content: row.row?.content || row.row?.icerik || row.row?.text || '',
      source: 'HuggingFace Dataset',
    }));

    console.log(`HuggingFace'den ${cases.length} karar başarıyla alındı.`);
    return cases.filter((c) => c.content && c.content.length > 0);
  } catch (err) {
    console.warn('HuggingFace API hatası:', err.message);
    console.log('Yerel örnek verilere geçiliyor...');
    return null;
  }
};

/**
 * Load fallback cases from local JSON file
 * @returns {Array} Array of sample cases
 */
const loadSampleCases = () => {
  const samplePath = path.join(__dirname, 'sampleCases.json');
  const cases = require(samplePath);
  console.log(`Yerel dosyadan ${cases.length} örnek karar yüklendi.`);
  return cases;
};

/**
 * Clean text: remove excessive whitespace and normalize
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
};

/**
 * Chunk text if it exceeds the maximum length
 * @param {Object} caseItem - Case object
 * @param {number} maxLength - Maximum content length before chunking
 * @returns {Array} Array of case objects (possibly chunked)
 */
const chunkCase = (caseItem, maxLength = 1000) => {
  const content = cleanText(caseItem.content);

  if (content.length <= maxLength) {
    return [{ ...caseItem, content }];
  }

  // Split into chunks at sentence boundaries
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map((chunk, index) => ({
    ...caseItem,
    case_number: chunks.length > 1
      ? `${caseItem.case_number}_chunk${index + 1}`
      : caseItem.case_number,
    content: chunk,
  }));
};

/**
 * Upsert a single case into the database with its embedding
 * @param {Object} caseItem - Case object with embedding
 */
const upsertCase = async (caseItem) => {
  const vectorString = `[${caseItem.embedding.join(',')}]`;

  await pool.query(
    `INSERT INTO precedent_cases (case_number, court, decision_number, decision_date, subject, content, embedding, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)
     ON CONFLICT (case_number)
     WHERE case_number IS NOT NULL
     DO UPDATE SET
       court = EXCLUDED.court,
       decision_number = EXCLUDED.decision_number,
       decision_date = EXCLUDED.decision_date,
       subject = EXCLUDED.subject,
       content = EXCLUDED.content,
       embedding = EXCLUDED.embedding,
       source = EXCLUDED.source`,
    [
      caseItem.case_number,
      caseItem.court,
      caseItem.decision_number,
      caseItem.decision_date || null,
      caseItem.subject,
      caseItem.content,
      vectorString,
      caseItem.source || 'Manuel Giriş',
    ]
  );
};

/**
 * Main ingestion pipeline
 */
const ingest = async () => {
  console.log('════════════════════════════════════════');
  console.log('  MİZAN AI - Veri Yükleme İşlemi');
  console.log('════════════════════════════════════════\n');

  try {
    // Initialize database schema
    console.log('Veritabanı şeması kontrol ediliyor...');
    await initializeDatabase();
    console.log('');

    // Try HuggingFace first, fall back to local data
    let cases = await fetchFromHuggingFace();
    if (!cases) {
      cases = loadSampleCases();
    }

    // Clean and chunk cases
    console.log('\nVeriler temizleniyor ve parçalanıyor...');
    const processedCases = [];
    for (const caseItem of cases) {
      const chunks = chunkCase(caseItem);
      processedCases.push(...chunks);
    }
    console.log(`Toplam ${processedCases.length} parça işlenecek.\n`);

    // Embed and upsert each case
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < processedCases.length; i++) {
      const caseItem = processedCases[i];
      const label = caseItem.case_number || `case_${i + 1}`;

      try {
        console.log(`Ingesting case ${i + 1} of ${processedCases.length}: ${label}`);

        // Generate embedding for case content
        const textToEmbed = [
          caseItem.subject || '',
          caseItem.content,
        ].filter(Boolean).join(' - ');

        const embedding = await embedText(textToEmbed);
        caseItem.embedding = embedding;

        // Upsert into database
        await upsertCase(caseItem);
        successCount++;

        // Rate limit delay between API calls
        if (i < processedCases.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (err) {
        console.error(`  ✗ Hata (${label}): ${err.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n════════════════════════════════════════');
    console.log('  Yükleme Tamamlandı');
    console.log('════════════════════════════════════════');
    console.log(`  ✓ Başarılı: ${successCount}`);
    console.log(`  ✗ Hatalı:   ${errorCount}`);
    console.log(`  Toplam:    ${processedCases.length}`);
    console.log('════════════════════════════════════════\n');
  } catch (err) {
    console.error('Ingestion pipeline hatası:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Veritabanı bağlantısı kapatıldı.');
  }
};

// Run ingestion
ingest();
