/**
 * Seed the database with realistic synthetic AQI data for 8 Indian cities
 * over the past 30 days. Used when live API keys are unavailable so the
 * dashboard remains demoable.
 *
 * Each city's daily baseline + hourly diurnal variation + random noise.
 */
require('dotenv').config();
const db = require('../config/db');
const { calculateAQI } = require('../services/aqiCalculator');

const CITIES = [
  { city: 'Delhi',     state: 'Delhi',         lat: 28.6139, lon: 77.2090, baselinePM25: 95 },
  { city: 'Mumbai',    state: 'Maharashtra',   lat: 19.0760, lon: 72.8777, baselinePM25: 55 },
  { city: 'Bengaluru', state: 'Karnataka',     lat: 12.9716, lon: 77.5946, baselinePM25: 35 },
  { city: 'Kolkata',   state: 'West Bengal',   lat: 22.5726, lon: 88.3639, baselinePM25: 75 },
  { city: 'Chennai',   state: 'Tamil Nadu',    lat: 13.0827, lon: 80.2707, baselinePM25: 42 },
  { city: 'Hyderabad', state: 'Telangana',     lat: 17.3850, lon: 78.4867, baselinePM25: 50 },
  { city: 'Pune',      state: 'Maharashtra',   lat: 18.5204, lon: 73.8567, baselinePM25: 48 },
  { city: 'Lucknow',   state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, baselinePM25: 88 },
];

const POLLUTANT_RATIOS = {
  pm10: 1.8,
  no2: 0.6,
  so2: 0.2,
  co: 0.02,
  o3: 0.5,
  nh3: 0.35,
};

const HOURS = 24 * 30;

const insertLoc = db.prepare(`
  INSERT OR IGNORE INTO locations (city, state, country, station_name, latitude, longitude, source)
  VALUES (?, ?, 'India', ?, ?, ?, 'synthetic')
`);
const findLoc = db.prepare(`SELECT location_id FROM locations WHERE city = ? AND station_name = ?`);
const findPol = db.prepare(`SELECT pollutant_id, code FROM pollutants`);
const insertM = db.prepare(`
  INSERT OR IGNORE INTO measurements (location_id, pollutant_id, value, measured_at, source)
  VALUES (?, ?, ?, ?, 'synthetic')
`);
const insertA = db.prepare(`
  INSERT OR REPLACE INTO aqi_records
    (location_id, aqi_value, category, dominant_pollutant, temperature, humidity, measured_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertAlert = db.prepare(`
  INSERT INTO alerts (location_id, aqi_value, category, message, triggered_at)
  VALUES (?, ?, ?, ?, ?)
`);

function diurnalFactor(hour) {
  // Indian metro pattern: morning peak (7-10) and evening peak (18-22), midday dip
  if (hour >= 6 && hour <= 10) return 1.35;
  if (hour >= 18 && hour <= 22) return 1.45;
  if (hour >= 11 && hour <= 16) return 0.85;
  return 1.05;
}

function noisy(base, pct = 0.15) {
  const delta = (Math.random() - 0.5) * 2 * pct * base;
  return Math.max(0, base + delta);
}

const seed = db.transaction(() => {
  const pollutants = findPol.all();
  const polId = Object.fromEntries(pollutants.map((p) => [p.code, p.pollutant_id]));

  const now = new Date();
  let measurementCount = 0;
  let aqiCount = 0;
  let alertCount = 0;

  for (const c of CITIES) {
    const stationName = `${c.city} - Central`;
    insertLoc.run(c.city, c.state, stationName, c.lat, c.lon);
    const loc = findLoc.get(c.city, stationName);
    if (!loc) continue;

    for (let h = HOURS; h >= 0; h -= 1) {
      const ts = new Date(now.getTime() - h * 3_600_000);
      const hour = ts.getUTCHours();
      const factor = diurnalFactor(hour) * (0.9 + 0.2 * Math.sin(h / 24));

      const pm25 = noisy(c.baselinePM25 * factor, 0.2);
      const pollutantValues = { pm25 };
      for (const [code, ratio] of Object.entries(POLLUTANT_RATIOS)) {
        pollutantValues[code] = noisy(pm25 * ratio, 0.25);
      }
      const temperature = noisy(26 + 5 * Math.sin((hour - 14) / 24 * Math.PI), 0.1);
      const humidity = noisy(60 + 15 * Math.sin(h / 12), 0.1);

      const isoTs = ts.toISOString();

      for (const [code, val] of Object.entries(pollutantValues)) {
        if (polId[code]) {
          insertM.run(loc.location_id, polId[code], Number(val.toFixed(2)), isoTs);
          measurementCount += 1;
        }
      }
      if (polId.temperature) insertM.run(loc.location_id, polId.temperature, Number(temperature.toFixed(2)), isoTs);
      if (polId.humidity)    insertM.run(loc.location_id, polId.humidity,    Number(humidity.toFixed(2)),    isoTs);

      const { aqi, category, dominantPollutant } = calculateAQI(pollutantValues);
      if (aqi != null) {
        insertA.run(loc.location_id, aqi, category, dominantPollutant,
          Number(temperature.toFixed(1)), Number(humidity.toFixed(1)), isoTs);
        aqiCount += 1;

        if (aqi > 300 && h < 72 && Math.random() < 0.25) {
          insertAlert.run(
            loc.location_id, aqi, category,
            `Hazardous air quality (AQI=${aqi}, dominant ${dominantPollutant})`,
            isoTs
          );
          alertCount += 1;
        }
      }
    }
    console.log(`  seeded ${c.city}`);
  }

  return { measurementCount, aqiCount, alertCount };
});

console.log('Seeding synthetic AQI data (8 cities x 30 days)...');
const r = seed();
console.log(`\nDone.`);
console.log(`  measurements: ${r.measurementCount}`);
console.log(`  aqi records : ${r.aqiCount}`);
console.log(`  alerts      : ${r.alertCount}`);
