require('dotenv').config({ path: __dirname + '/../.env' });
const { query } = require('../src/config/database');
const { embedText } = require('../src/services/embeddingService');

// Regex patterns for extracting metadata from content text
const courtPatterns = [
  /Hukuk Genel Kurulu/,
  /Yargıtay\s+\d+\.\s+\w+\s+Dairesi/,
  /Yargıtay\s+\d+\.\s+\w+\s+\w+\s+Dairesi/,
  /(\w+)\s+Asliye\s+Hukuk\s+Mahkemesi/,
  /(\w+)\s+İş\s+Mahkemesi/,
  /(\w+)\s+Bölge\s+Adliye\s+Mahkemesi/,
  /(\w+)\s+Ağır\s+Ceza\s+Mahkemesi/,
];

function extractCourt(text) {
  for (const pattern of courtPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length < 120) return firstLine;
  return null;
}

function extractCaseNumber(text) {
  const match = text.match(/(\d{4}\/\d+)\s*E\./);
  return match ? match[1] : null;
}

function extractDecisionNumber(text) {
  const match = text.match(/(\d{4}\/\d+)\s*K\./);
  return match ? match[1] : null;
}

function extractDate(text) {
  const match = text.match(/(\d{2}\.\d{2}\.\d{4})/);
  if (!match) return null;
  const [day, month, year] = match[1].split('.');
  const d = new Date(`${year}-${month}-${day}`);
  return isNaN(d.getTime()) ? null : d;
}

function extractSubject(text) {
  let courtEnd = 0;
  for (const pattern of courtPatterns) {
    const match = text.match(pattern);
    if (match) {
      courtEnd = match.index + match[0].length;
      break;
    }
  }
  const snippet = text.substring(courtEnd, courtEnd + 150).trim();
  const sentenceEnd = snippet.search(/[.!?\n]/);
  if (sentenceEnd > 10 && sentenceEnd < 120) return snippet.substring(0, sentenceEnd + 1).trim();
  return snippet.substring(0, 100).trim();
}

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
}

function chunkText(text, maxWords = 600, overlapWords = 75) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return [text];
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
    i += (maxWords - overlapWords);
  }
  return chunks;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function embedWithRetry(text, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const embedding = await embedText(text);
      return embedding;
    } catch (err) {
      if (err.message && err.message.includes('429')) {
        const waitTime = 10000 * (i + 1);
        console.warn(`[429 Rate Limit] Waiting ${waitTime}ms...`);
        await delay(waitTime);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded for embedding.");
}

async function ingestDataset() {
  const datasetName = 'newmindai/caselaw-retrieval';
  let offset = 457; // We already have ~457 cases
  let totalProcessed = 0;

  console.log(`Starting continuous ingestion from ${datasetName} at offset ${offset}`);

  while (true) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=${datasetName}&config=corpus&split=train&offset=${offset}&limit=100`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`HF API Error: ${response.status} ${response.statusText}`);
        await delay(60000); // Wait a minute before retrying
        continue;
      }
      
      const data = await response.json();
      const rows = data.rows || [];
      
      if (rows.length === 0) {
        console.log("No more rows found. Finished!");
        break;
      }

      console.log(`\nFetched rows ${offset} to ${offset + rows.length - 1}...`);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].row;
        const rawContent = row.text;
        if (!rawContent) continue;

        const court = extractCourt(rawContent) || 'Bilinmeyen Mahkeme';
        const caseNum = extractCaseNumber(rawContent) || `case-${Date.now()}-${offset + i}`;
        const decNum = extractDecisionNumber(rawContent);
        const date = extractDate(rawContent);
        const subject = extractSubject(rawContent) || 'Hukuki Metin';

        // Check if case already exists to avoid duplicate embedding
        const existing = await query(`SELECT id FROM precedent_cases WHERE case_number = $1 LIMIT 1`, [caseNum]);
        if (existing.rows.length > 0) {
          console.log(`Skipping existing case ${caseNum}`);
          continue;
        }

        const cleanedContent = cleanText(rawContent);
        const chunks = chunkText(cleanedContent);
        
        console.log(`Ingesting record ${offset + i + 1} (${chunks.length} chunks) - ${caseNum}`);

        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];
          try {
            const embedding = await embedWithRetry(chunk);
            const embeddingString = `[${embedding.join(',')}]`;
            const finalCaseNumber = chunks.length > 1 ? `${caseNum}-part${j + 1}` : caseNum;

            await query(
              `INSERT INTO precedent_cases (case_number, court, decision_number, decision_date, subject, content, embedding, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (case_number) WHERE case_number IS NOT NULL DO NOTHING`,
              [
                finalCaseNumber,
                court,
                decNum,
                date,
                subject,
                chunk,
                embeddingString,
                'huggingface-caselaw'
              ]
            );
          } catch (err) {
            console.error(`Failed to process chunk ${j + 1} of record ${offset + i + 1}:`, err.message);
          }
          await delay(4000); // 15 RPM
        }
        totalProcessed++;
      }
      
      offset += rows.length;
    } catch (error) {
      console.error(`Error processing offset ${offset}:`, error.message);
      await delay(10000);
    }
  }
}

ingestDataset().catch(console.error);
