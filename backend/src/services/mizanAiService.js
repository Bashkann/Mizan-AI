const { GoogleGenerativeAI } = require('@google/generative-ai');
const { embedText } = require('./embeddingService');
const { similaritySearch } = require('./vectorStoreService');
const { buildSystemPrompt } = require('./systemPrompt');
const { query } = require('../config/database');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LLM_MODEL = process.env.GEMINI_LLM_MODEL || 'gemini-1.5-flash';

// Hardcoded fallback message when no relevant cases are found
const NO_RESULTS_MESSAGE =
  'Bu davaya ilişkin veritabanımda yeterli emsal karar bulunamadı. Lütfen daha fazla detay ekleyin.';

/**
 * Main RAG orchestrator: embeds query, searches vector store,
 * generates LLM response with retrieved context, and saves to history.
 *
 * @param {string} caseDescription - User's case description
 * @param {string} userId - Authenticated user's ID
 * @returns {Promise<Object>} Analysis result with cited case and confidence
 */
const analyzeCase = async (caseDescription, userId) => {
  // Step 1: Embed user query
  const queryEmbedding = await embedText(caseDescription);

  // Step 2: Search vector store for similar precedent cases
  const relevantCases = await similaritySearch(queryEmbedding, 3, 0.75);

  // Step 3: If no results above threshold, return fallback without calling LLM
  if (!relevantCases || relevantCases.length === 0) {
    // Save the query with no response to history
    await saveQuery(userId, caseDescription, NO_RESULTS_MESSAGE, null);

    return {
      analysis: NO_RESULTS_MESSAGE,
      citedCase: null,
      confidence: 0,
    };
  }

  // Step 4: Build augmented prompt with retrieved cases
  const systemPrompt = buildSystemPrompt(relevantCases);

  const userPrompt = `
Aşağıdaki dava açıklamasını analiz et ve sağlanan emsal kararlarla karşılaştır:

DAVA AÇIKLAMASI:
${caseDescription}

Lütfen belirtilen çıktı formatına uygun şekilde yanıt ver.`;

  // Step 5: Call Gemini LLM with system prompt + context + query
  const model = genAI.getGenerativeModel({
    model: LLM_MODEL,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const llmResponse = response.text();

  if (!llmResponse) {
    throw new Error('LLM yanıt üretemedi.');
  }

  // The top result is the most relevant cited case
  const topResult = relevantCases[0];
  const topSimilarity = topResult.similarity;

  // Step 6: Save query to database
  await saveQuery(userId, caseDescription, llmResponse, topResult.id);

  // Step 7: Return structured result
  return {
    analysis: llmResponse,
    citedCase: topResult,
    confidence: topSimilarity,
    additionalCases: relevantCases.slice(1),
  };
};

/**
 * Save a query and its response to the queries table
 * @param {string} userId - User ID
 * @param {string} queryText - Original query text
 * @param {string} response - AI response text
 * @param {string|null} citedCaseId - ID of the primary cited case
 */
const saveQuery = async (userId, queryText, response, citedCaseId) => {
  try {
    await query(
      `INSERT INTO queries (user_id, query_text, response, cited_case_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, queryText, response, citedCaseId]
    );
  } catch (err) {
    // Log but don't throw - saving history shouldn't break the main flow
    console.error('Failed to save query to history:', err.message);
  }
};

module.exports = { analyzeCase };
