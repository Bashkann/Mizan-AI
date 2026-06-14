const { GoogleGenerativeAI } = require('@google/generative-ai');
const { embedText } = require('./embeddingService');
const { similaritySearch } = require('./vectorStoreService');
const { buildSystemPrompt } = require('./systemPrompt');
const { query } = require('../config/database');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LLM_MODEL = process.env.GEMINI_LLM_MODEL || 'gemini-2.5-flash';

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
  const lowerDesc = caseDescription.toLowerCase();

  // 1. Casual / Greeting Mode
  const casualKeywords = ["selam", "merhaba", "nasılsın", "naber", "hey", "hi", "hello"];
  // We check if it's strictly short OR contains a clear greeting
  const isCasual = caseDescription.length <= 20 || casualKeywords.some(k => lowerDesc === k || lowerDesc.startsWith(k + ' '));

  if (isCasual) {
    const msg = "Merhaba! Size nasıl yardımcı olabilirim?";
    await saveQuery(userId, caseDescription, msg, null, 0, null);
    return {
      mode: 'casual',
      analysis: msg,
      citedCase: null,
      confidence: 0,
      additionalCases: []
    };
  }

  // 2. Determine if Case or General
  const caseKeywords = ["müvekkil", "dava", "mahkeme", "işten çıkarıldı", "tazminat", "fesih", "sözleşme", "şikayetçiyim", "dava açmak"];
  const isCase = caseDescription.length > 100 || caseKeywords.some(k => lowerDesc.includes(k));

  const generalKeywords = ["nedir", "nasıl", "ne zaman", "açıkla", "anlat", "kaç yıl", "ceza", "hapis"];
  const isGeneralQuestion = generalKeywords.some(keyword => lowerDesc.includes(keyword)) && !isCase;

  if (isGeneralQuestion) {
    return await askGeneralQuestion(caseDescription, userId);
  }

  // 3. RAG Pipeline (Fallback/Case Analysis)

  // Step 1: Embed user query
  const queryEmbedding = await embedText(caseDescription);

  // Step 2: Search vector store for similar precedent cases
  const relevantCases = await similaritySearch(queryEmbedding, 3, 0.75);

  // Step 3: If no results above threshold, return fallback without calling LLM
  if (!relevantCases || relevantCases.length === 0) {
    // Save the query with no response to history
    await saveQuery(userId, caseDescription, NO_RESULTS_MESSAGE, null, 0, null);

    return {
      mode: 'rag',
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

  // Step 6: Save query to database with additional metadata
  const citedCaseMetadata = {
    caseNumber: topResult.case_number,
    court: topResult.court,
    decisionNumber: topResult.decision_number,
    decisionDate: topResult.decision_date,
    subject: topResult.subject,
    content: topResult.content
  };
  const confidenceInt = Math.round(topSimilarity * 100);
  await saveQuery(userId, caseDescription, llmResponse, topResult.id, confidenceInt, citedCaseMetadata);

  // Step 7: Return structured result
  return {
    mode: 'rag',
    analysis: llmResponse,
    citedCase: topResult,
    confidence: topSimilarity,
    additionalCases: relevantCases.slice(1),
  };
};

/**
 * Handle general legal questions without RAG vector search
 */
const askGeneralQuestion = async (queryText, userId) => {
  const systemPrompt = `Sen MİZAN AI, Türk hukuku konusunda uzman bir yapay zeka asistanısın.
Türk hukuk mevzuatı hakkında genel sorulara kapsamlı ve doğru cevaplar ver.
Cevaplarını her zaman 'Bu bilgi genel hukuki bilgi niteliğindedir, kesin hukuki tavsiye için avukata danışınız.' uyarısıyla bitir.`;

  const model = genAI.getGenerativeModel({
    model: LLM_MODEL,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(queryText);
  const llmResponse = result.response.text();

  if (!llmResponse) {
    throw new Error('LLM yanıt üretemedi.');
  }

  await saveQuery(userId, queryText, llmResponse, null, 0, null);

  return {
    mode: 'general',
    analysis: llmResponse,
    citedCase: null,
    confidence: 0,
    additionalCases: [],
  };
};

/**
 * Save a query and its response to the queries table
 * @param {string} userId - User ID
 * @param {string} queryText - Original query text
 * @param {string} response - AI response text
 * @param {string|null} citedCaseId - ID of the primary cited case
 * @param {number} confidenceScore - Confidence score (0-100)
 * @param {Object} citedCaseMetadata - JSON metadata of the cited case
 */
const saveQuery = async (userId, queryText, response, citedCaseId, confidenceScore = 0, citedCaseMetadata = null) => {
  try {
    await query(
      `INSERT INTO queries (user_id, query_text, response, cited_case_id, confidence_score, cited_case_metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, queryText, response, citedCaseId, confidenceScore, citedCaseMetadata]
    );
  } catch (err) {
    // Log but don't throw - saving history shouldn't break the main flow
    console.error('Failed to save query to history:', err.message);
  }
};

/**
 * Extract case details from a document using Gemini and run RAG analysis
 * @param {string} base64Data - Base64 encoded file content
 * @param {string} mimeType - MIME type of the file
 * @param {string} userId - Authenticated user's ID
 */
const analyzeDocument = async (base64Data, mimeType, userId) => {
  const model = genAI.getGenerativeModel({ model: LLM_MODEL });
  const prompt = `Lütfen ekteki belgeyi incele ve davanın içeriğini, taraflarını ve hukuki uyuşmazlığı özetleyen detaylı bir dava açıklaması çıkar. Bu açıklama, emsal karar araması için kullanılacaktır. Lütfen sadece dava açıklamasını düz metin olarak ver. Başka bir yorum yapma.`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const extractedDescription = result.response.text();
    if (!extractedDescription) {
      throw new Error('Belgeden dava açıklaması çıkarılamadı.');
    }

    // Now pipe the extracted text into the standard RAG pipeline
    const analysisResult = await analyzeCase(extractedDescription, userId);
    
    // Attach the extracted text so the UI knows what was searched
    return {
      ...analysisResult,
      extractedQuery: extractedDescription
    };
  } catch (error) {
    console.error('Document extraction error:', error.message);
    throw new Error('Belge analizi sırasında bir hata oluştu: ' + error.message);
  }
};

module.exports = { analyzeCase, analyzeDocument };
