const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyiniz.',
  },
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * AI endpoint rate limiter: 10 requests per 15 minutes per IP
 * More restrictive to protect expensive LLM calls
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI sorgu limitinize ulaştınız. Lütfen 15 dakika sonra tekrar deneyiniz.',
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
});

module.exports = { globalLimiter, aiLimiter };
