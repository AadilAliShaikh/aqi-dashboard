require('dotenv').config();
const etl = require('../services/etlService');

(async () => {
  try {
    const r = await etl.runFullPipeline();
    console.log('Ingestion finished:', r);
    process.exit(0);
  } catch (e) {
    console.error('Ingestion failed:', e.message);
    process.exit(1);
  }
})();
