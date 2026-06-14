require('dotenv').config({ path: __dirname + '/../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../src/config/database');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EMBEDDING_MODEL = 'gemini-embedding-001';

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

async function embedText(text, retries = 3) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err) {
      if (err.message && err.message.includes('429')) {
        console.warn(`[429 Rate Limit] Bekleniyor... (${10 * (i + 1)} saniye)`);
        await delay(10000 * (i + 1));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded for embedding.");
}

async function ingestDataset(datasetName, sourceTag) {
  console.log(`\n--- Starting ingestion for ${datasetName} ---`);
  let offset = 0;
  let hasMore = true;
  let totalProcessed = 0;
  let totalChunks = 0;

  while (hasMore) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=${datasetName}&config=corpus&split=train&offset=${offset}&limit=100`;
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const response = await global.fetch(url);
      if (!response.ok) throw new Error(`HF API Error: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      const rows = data.rows || [];
      
      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\nFetched rows ${offset} to ${offset + rows.length - 1}...`);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].row;
        // Map features from config=corpus which only has _id and text
        const caseNumber = row._id || `case-${Date.now()}-${offset + i}`;
        const rawContent = row.text;

        if (!rawContent) {
          console.warn(`Row ${offset + i} missing text content, skipping...`);
          continue;
        }

        const cleanedContent = cleanText(rawContent);
        const chunks = chunkText(cleanedContent);
        
        console.log(`Ingesting record ${offset + i + 1} (${chunks.length} chunks) - ID: ${caseNumber}`);

        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];
          try {
            const embedding = await embedText(chunk);
            const embeddingString = `[${embedding.join(',')}]`;
            const finalCaseNumber = chunks.length > 1 ? `${caseNumber}-part${j + 1}` : caseNumber;

            // Use default values for missing metadata fields
            await query(
              `INSERT INTO precedent_cases (case_number, court, decision_number, decision_date, subject, content, embedding, source)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (case_number) WHERE case_number IS NOT NULL DO NOTHING`,
              [
                finalCaseNumber,
                'Bilinmeyen Mahkeme', // court
                null,                 // decision_number
                null,                 // decision_date
                'Hukuki Metin',       // subject
                chunk,
                embeddingString,
                sourceTag
              ]
            );
            totalChunks++;
          } catch (err) {
            console.error(`Failed to process chunk ${j + 1} of record ${offset + i + 1}:`, err.message);
          }
          await delay(4000); // 15 requests per minute limit = ~4000ms delay
        }
        totalProcessed++;
      }
      
      offset += 100;
    } catch (error) {
      console.error(`Error fetching or processing offset ${offset}:`, error.message);
      // Stop loop on fatal fetch error
      hasMore = false;
    }
  }

  console.log(`--- Completed ${datasetName}. Processed ${totalProcessed} records into ${totalChunks} chunks. ---`);
}

async function run() {
  try {
    await ingestDataset('newmindai/caselaw-retrieval', 'huggingface-caselaw');
    await ingestDataset('newmindai/regulation-retrieval', 'huggingface-regulation');
    console.log('\nAll datasets ingested successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during ingestion:', error);
    process.exit(1);
  }
}

run();
