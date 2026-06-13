const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

/**
 * Generate an embedding vector for a single text string
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} 768-dimensional embedding vector
 */
const embedText = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Embedding için geçerli bir metin gereklidir.');
  }

  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const result = await model.embedContent(text);
  const embedding = result.embedding.values;

  if (!embedding || embedding.length === 0) {
    throw new Error('Embedding oluşturulamadı.');
  }

  return embedding;
};

/**
 * Generate embedding vectors for a batch of texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of 768-dimensional embedding vectors
 */
const embedBatch = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Embedding için en az bir metin gereklidir.');
  }

  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const embeddings = [];

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (text) => {
        const result = await model.embedContent(text);
        return result.embedding.values;
      })
    );

    embeddings.push(...batchResults);

    // Small delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return embeddings;
};

module.exports = { embedText, embedBatch };
