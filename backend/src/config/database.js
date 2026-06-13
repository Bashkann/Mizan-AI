const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool configured for Neon serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Log pool errors to prevent unhandled rejections
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * Helper function for parameterized queries
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Initialize database schema: extensions, tables, and indexes
 */
const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Enable required extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Precedent cases table with vector embeddings
    await client.query(`
      CREATE TABLE IF NOT EXISTS precedent_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_number VARCHAR(255),
        court VARCHAR(255) NOT NULL,
        decision_number VARCHAR(255),
        decision_date DATE,
        subject TEXT,
        content TEXT NOT NULL,
        embedding vector(768),
        source VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Queries table for user history
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        query_text TEXT NOT NULL,
        response TEXT,
        cited_case_id UUID REFERENCES precedent_cases(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // HNSW index for fast vector similarity search
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_precedent_cases_embedding
      ON precedent_cases
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);

    // Index on user queries for faster history retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_queries_user_id
      ON queries (user_id, created_at DESC);
    `);

    // Unique index on case_number for upserts
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_precedent_cases_case_number
      ON precedent_cases (case_number)
      WHERE case_number IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, initializeDatabase };
