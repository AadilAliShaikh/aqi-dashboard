/**
 * Wipe all measurements/aqi/alerts/forecasts but keep schema + pollutant master.
 * Use BEFORE running `npm run ingest` to switch from synthetic to live data.
 */
require('dotenv').config();
const db = require('../config/db');

console.log('Resetting database (measurements, AQI, alerts, forecasts)...');

const tx = db.transaction(() => {
  db.exec(`
    DELETE FROM forecasts;
    DELETE FROM alerts;
    DELETE FROM aqi_records;
    DELETE FROM measurements;
    DELETE FROM locations;
    DELETE FROM etl_runs;
  `);
});
tx();

const counts = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM measurements) AS measurements,
    (SELECT COUNT(*) FROM aqi_records)  AS aqi,
    (SELECT COUNT(*) FROM alerts)       AS alerts,
    (SELECT COUNT(*) FROM locations)    AS locations,
    (SELECT COUNT(*) FROM pollutants)   AS pollutants
`).get();

console.log('Reset complete. Current counts:', counts);
console.log('\nNext steps:');
console.log('  npm run ingest   # to pull live CPCB + OpenAQ data');
console.log('  npm run seed     # to repopulate with synthetic data');
