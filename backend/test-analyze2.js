require('dotenv').config();
const { analyzeCase } = require('./src/services/mizanAiService');

async function test() {
  try {
    // using a query that is longer to trigger the RAG pipeline fully
    const res = await analyzeCase("İşveren beni haksız yere işten çıkardı. İhbar ve kıdem tazminatımı ödemedi. Mahkemeye versem kazanır mıyım? Emsal karar var mı?", "00000000-0000-0000-0000-000000000000");
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
