require('dotenv').config({ path: __dirname + '/../.env' });
const { query } = require('../src/config/database');

// Regex patterns for extracting metadata from content text
const courtPatterns = [
  /Hukuk Genel Kurulu/,
  /Yargıtay\s+\d+\.\s+\w+\s+Dairesi/,
  /Yargıtay\s+\d+\.\s+\w+\s+\w+\s+Dairesi/,
  /(\w+)\s+Asliye\s+Hukuk\s+Mahkemesi/,
  /(\w+)\s+İş\s+Mahkemesi/,
  /(\w+)\s+Bölge\s+Adliye\s+Mahkemesi/,
  /(\w+)\s+Ağır\s+Ceza\s+Mahkemesi/,
];

function extractCourt(text) {
  for (const pattern of courtPatterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  // Fallback: try first line
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length < 120) return firstLine;
  return null;
}

function extractCaseNumber(text) {
  const match = text.match(/(\d{4}\/\d+)\s*E\./);
  return match ? match[1] : null;
}

function extractDecisionNumber(text) {
  const match = text.match(/(\d{4}\/\d+)\s*K\./);
  return match ? match[1] : null;
}

function extractDate(text) {
  const match = text.match(/(\d{2}\.\d{2}\.\d{4})/);
  if (!match) return null;
  const [day, month, year] = match[1].split('.');
  const d = new Date(`${year}-${month}-${day}`);
  return isNaN(d.getTime()) ? null : d;
}

function extractSubject(text) {
  // Find the court name position, take the next 100 chars as subject
  let courtEnd = 0;
  for (const pattern of courtPatterns) {
    const match = text.match(pattern);
    if (match) {
      courtEnd = match.index + match[0].length;
      break;
    }
  }
  const snippet = text.substring(courtEnd, courtEnd + 150).trim();
  // Trim to first sentence or first 100 chars
  const sentenceEnd = snippet.search(/[.!?\n]/);
  if (sentenceEnd > 10 && sentenceEnd < 120) return snippet.substring(0, sentenceEnd + 1).trim();
  return snippet.substring(0, 100).trim();
}

async function fixMetadata() {
  console.log('--- Metadata Fix Script ---');
  console.log('Fetching records with missing metadata...\n');

  const result = await query(
    `SELECT id, content FROM precedent_cases 
     WHERE court = 'Bilinmeyen Mahkeme' OR court IS NULL 
     ORDER BY created_at`
  );

  const rows = result.rows;
  console.log(`Found ${rows.length} records to fix.\n`);

  let fixed = 0;

  for (let i = 0; i < rows.length; i++) {
    const { id, content } = rows[i];
    if (!content) continue;

    const court = extractCourt(content);
    const caseNum = extractCaseNumber(content);
    const decNum = extractDecisionNumber(content);
    const date = extractDate(content);
    const subject = extractSubject(content);

    // Only update if we found at least some data
    if (court || caseNum || decNum || date || subject) {
      try {
        await query(
          `UPDATE precedent_cases 
           SET court = COALESCE($1, court),
               decision_number = COALESCE($2, decision_number),
               decision_date = COALESCE($3, decision_date),
               subject = COALESCE($4, subject)
           WHERE id = $5`,
          [
            court || 'Bilinmeyen Mahkeme',
            decNum,
            date,
            subject || 'Hukuki Metin',
            id
          ]
        );
        fixed++;
        if (fixed % 50 === 0 || i === rows.length - 1) {
          console.log(`Fixed ${fixed} of ${rows.length} records...`);
        }
      } catch (err) {
        console.error(`Error updating record ${id}:`, err.message);
      }
    }
  }

  console.log(`\n--- Done! Fixed ${fixed} of ${rows.length} records. ---`);
  process.exit(0);
}

fixMetadata().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
