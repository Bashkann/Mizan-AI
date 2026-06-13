const express = require('express');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validateQuery, handleValidationErrors } = require('../middleware/validators');
const { analyzeCase } = require('../services/mizanAiService');
const { query } = require('../config/database');

const router = express.Router();

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

    const history = result.rows.map((row) => ({
      id: row.id,
      queryText: row.query_text,
      response: row.response,
      createdAt: row.created_at,
      citedCase: row.case_number
        ? {
            caseNumber: row.case_number,
            court: row.court,
            decisionNumber: row.decision_number,
            subject: row.subject,
          }
        : null,
    }));

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
