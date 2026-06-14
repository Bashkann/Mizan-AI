require('dotenv').config();
const { analyzeCase } = require('./src/services/mizanAiService');

async function test() {
  try {
    const res = await analyzeCase("İşveren haksız yere işime son verdi", "00000000-0000-0000-0000-000000000000");
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
