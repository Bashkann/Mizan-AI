const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint with DB connectivity test
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Test database connectivity
    const dbResult = await pool.query('SELECT NOW()');
    healthCheck.database = {
      status: 'connected',
      serverTime: dbResult.rows[0].now,
    };
  } catch (err) {
    healthCheck.database = {
      status: 'disconnected',
      error: err.message,
    };
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

module.exports = router;
