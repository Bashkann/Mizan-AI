require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const { initializeDatabase } = require('./config/database');
const { globalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const mizanRoutes = require('./routes/mizanRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ────────────────────────────────────────────────────────

// Helmet for HTTP security headers
app.set('trust proxy', 1);
app.use(helmet());

// CORS configuration - whitelist frontend URL
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing & Cookies ─────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ─── Rate Limiting ──────────────────────────────────────────────────────────────

app.use(globalLimiter);

// ─── Passport Initialization ────────────────────────────────────────────────────

app.use(passport.initialize());

// ─── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mizan', mizanRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MİZAN AI Backend',
    version: '1.0.0',
    description: 'Türk Hukuku Yapay Zeka Asistanı',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      mizan: '/api/mizan',
    },
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'İstenen kaynak bulunamadı.',
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyiniz.',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Server Startup ─────────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    // Initialize database schema
    await initializeDatabase();
    console.log('Database schema initialized');

    app.listen(PORT, () => {
      console.log(`MİZAN AI Backend running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
