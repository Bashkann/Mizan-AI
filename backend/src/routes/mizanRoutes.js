const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validateQuery, handleValidationErrors } = require('../middleware/validators');
const { analyzeCase, analyzeDocument } = require('../services/mizanAiService');
const { query } = require('../config/database');

const router = express.Router();

// Configure multer for memory storage (we need buffer for base64 conversion)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF ve DOCX dosyaları desteklenmektedir.'));
    }
  },
});

/**
 * POST /api/mizan/query
 * Submit a case description for AI analysis against precedent cases
 * Requires authentication, rate limited, input validated
 */
router.post(
  '/query',
  authenticate,
  aiLimiter,
  validateQuery,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { caseDescription } = req.body;
      const userId = req.user.id;

      const result = await analyzeCase(caseDescription, userId);

      res.json({
        success: true,
        data: {
          mode: result.mode,
          analysis: result.analysis,
          citedCase: result.citedCase
            ? {
                id: result.citedCase.id,
                caseNumber: result.citedCase.case_number,
                court: result.citedCase.court,
                decisionNumber: result.citedCase.decision_number,
                decisionDate: result.citedCase.decision_date,
                subject: result.citedCase.subject,
              }
            : null,
          confidence: result.confidence,
          additionalCases: result.additionalCases?.map((c) => ({
            id: c.id,
            caseNumber: c.case_number,
            court: c.court,
            decisionNumber: c.decision_number,
            decisionDate: c.decision_date,
            subject: c.subject,
            similarity: c.similarity,
          })) || [],
        },
      });
    } catch (err) {
      console.error('Query analysis error:', err.message);

      // Differentiate between known error types
      if (err.message.includes('Embedding')) {
        return res.status(502).json({
          success: false,
          message: 'Yapay zeka servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyiniz.',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Dava analizi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.',
      });
    }
  }
);

/**
 * POST /api/mizan/upload
 * Upload a PDF/DOCX for native Gemini extraction and RAG analysis
 */
router.post(
  '/upload',
  authenticate,
  aiLimiter,
  (req, res, next) => {
    upload.single('document')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Lütfen bir dosya yükleyin.',
        });
      }

      const userId = req.user.id;
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;

      const result = await analyzeDocument(base64Data, mimeType, userId);

      res.json({
        success: true,
        data: {
          mode: result.mode,
          extractedQuery: result.extractedQuery,
          analysis: result.analysis,
          citedCase: result.citedCase
            ? {
                id: result.citedCase.id,
                caseNumber: result.citedCase.case_number,
                court: result.citedCase.court,
                decisionNumber: result.citedCase.decision_number,
                decisionDate: result.citedCase.decision_date,
                subject: result.citedCase.subject,
              }
            : null,
          confidence: result.confidence,
          additionalCases: result.additionalCases?.map((c) => ({
            id: c.id,
            caseNumber: c.case_number,
            court: c.court,
            decisionNumber: c.decision_number,
            decisionDate: c.decision_date,
            subject: c.subject,
            similarity: c.similarity,
          })) || [],
        },
      });
    } catch (err) {
      console.error('Document upload error:', err.message);

      if (err.message.includes('Embedding')) {
        return res.status(502).json({
          success: false,
          message: 'Yapay zeka servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyiniz.',
        });
      }

      res.status(500).json({
        success: false,
        message: err.message || 'Belge analizi sırasında bir hata oluştu.',
      });
    }
  }
);

/**
 * GET /api/mizan/history
 * Retrieve the authenticated user's past queries (last 50, newest first)
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT
        q.id,
        q.query_text,
        q.response,
        q.created_at,
        q.confidence_score,
        q.cited_case_metadata,
        pc.case_number,
        pc.court,
        pc.decision_number,
        pc.subject
      FROM queries q
      LEFT JOIN precedent_cases pc ON q.cited_case_id = pc.id
      WHERE q.user_id = $1
      ORDER BY q.created_at DESC
      LIMIT 50`,
      [userId]
    );

    const history = result.rows.map((row) => {
      // Fallback to PC columns if cited_case_metadata doesn't exist (older records)
      let citedCase = null;
      if (row.cited_case_metadata) {
        citedCase = row.cited_case_metadata;
      } else if (row.case_number) {
        citedCase = {
          caseNumber: row.case_number,
          court: row.court,
          decisionNumber: row.decision_number,
          subject: row.subject,
        };
      }

      return {
        id: row.id,
        queryText: row.query_text,
        response: row.response,
        createdAt: row.created_at,
        confidenceScore: row.confidence_score,
        citedCase,
      };
    });

    res.json({
      success: true,
      data: {
        history,
        total: history.length,
      },
    });
  } catch (err) {
    console.error('History retrieval error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Sorgu geçmişi alınırken bir hata oluştu.',
    });
  }
});

module.exports = router;
