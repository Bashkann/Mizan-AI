const { query } = require('../config/database');

/**
 * Perform cosine similarity search against precedent_cases using pgvector
 * @param {number[]} queryVector - 768-dimensional query embedding
 * @param {number} topK - Maximum number of results to return (default: 3)
 * @param {number} threshold - Minimum similarity score (default: 0.75)
 * @returns {Promise<Array>} Matching cases sorted by similarity descending
 */
const similaritySearch = async (queryVector, topK = 3, threshold = 0.75) => {
  if (!queryVector || !Array.isArray(queryVector)) {
    throw new Error('Geçerli bir sorgu vektörü gereklidir.');
  }

  // Format vector as pgvector string: [x1,x2,...,xn]
  const vectorString = `[${queryVector.join(',')}]`;

  const sql = `
    SELECT
      id,
      case_number,
      court,
      decision_number,
      decision_date,
      subject,
      content,
      1 - (embedding <=> $1::vector) AS similarity
    FROM precedent_cases
    WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> $1::vector) >= $2
    ORDER BY similarity DESC
    LIMIT $3
  `;

  const result = await query(sql, [vectorString, threshold, topK]);

  return result.rows.map((row) => ({
    ...row,
    similarity: parseFloat(row.similarity),
    decision_date: row.decision_date
      ? new Date(row.decision_date).toISOString().split('T')[0]
      : null,
  }));
};

module.exports = { similaritySearch };
