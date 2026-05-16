const db = require('../config/db');
const cpcbService = require('./cpcbService');
const openAQService = require('./openAQService');
const { calculateAQI } = require('./aqiCalculator');

const DEFAULT_CITIES = (process.env.DEFAULT_CITIES || 'Delhi,Mumbai,Bengaluru,Kolkata,Chennai,Hyderabad,Pune,Lucknow')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Aliases — OpenAQ station names sometimes use older names
const CITY_ALIASES = {
  bengaluru: ['bengaluru', 'bangalore'],
  mumbai:    ['mumbai', 'bombay'],
  kolkata:   ['kolkata', 'calcutta'],
  chennai:   ['chennai', 'madras'],
};

function matchCityFromStation(stationName = '', cities) {
  const hay = stationName.toLowerCase();
  for (const c of cities) {
    const aliases = CITY_ALIASES[c.toLowerCase()] || [c.toLowerCase()];
    if (aliases.some((a) => hay.includes(a))) return c;
  }
  return null;
}

/* ------------------------------ Extract ------------------------------ */
async function extract({ cities = DEFAULT_CITIES } = {}) {
  const results = { cpcb: [], openaq: [] };

  try {
    results.cpcb = await cpcbService.fetchRealtime({ cities });
    console.log(`[ETL] Extracted ${results.cpcb.length} records from CPCB.`);
  } catch (e) {
    console.warn('[ETL] CPCB extract failed:', e.message);
  }

  try {
    results.openaq = await extractOpenAQMeasurements({ cities });
    console.log(`[ETL] Extracted ${results.openaq.length} measurements from OpenAQ.`);
  } catch (e) {
    console.warn('[ETL] OpenAQ extract failed:', e.message);
  }

  return results;
}

/**
 * Fetch flat measurement records from OpenAQ.
 * Strategy:
 *  1. List all Indian locations (up to 200).
 *  2. Keep only stations whose `datetimeLast` is within `maxAgeHours` AND
 *     whose name maps to one of our target cities.
 *  3. For each, call `/locations/{id}/latest` and join sensor → pollutant
 *     via the location's sensors[]. Drop stale + bad-unit + out-of-bound readings.
 *  4. Dedupe by (city, station, pollutant) keeping the freshest reading.
 */

// Sanity bounds — anything higher is sensor error, not real air
const SANITY_BOUNDS = {
  pm25: 1000,
  pm10: 2000,
  no2:  800,
  so2:  2000,
  co:   60,     // mg/m³ — CO in fires/tunnels can hit ~50, beyond that = sensor noise
  o3:   1000,
  nh3:  3000,
};

// PPB → µg/m³ conversion factors at 25°C, 1 atm (molar volume = 24.45 L/mol)
// formula: µg/m³ = ppb * (mol_weight / 24.45)
const PPB_TO_UGM3 = {
  no2: 1.88,
  so2: 2.62,
  o3:  1.96,
  co:  1.15,    // ppb -> µg/m³ ; we still need /1000 to get mg/m³ for CO breakpoints
};

function normalizeReading(pollutant, value, unit) {
  const u = (unit || '').toLowerCase();
  // ppb: convert to µg/m³
  if (u.includes('ppb')) {
    const factor = PPB_TO_UGM3[pollutant];
    if (!factor) return null;       // pollutant not convertible (e.g. nh3 ppb) — skip
    value = value * factor;
  }
  if (u.includes('ppm')) {
    const factor = PPB_TO_UGM3[pollutant];
    if (!factor) return null;
    value = value * factor * 1000;
  }
  // CO: AQI breakpoints expect mg/m³, OpenAQ ships µg/m³ — divide by 1000
  if (pollutant === 'co' && value > 50) {
    value = value / 1000;
  }
  // Final sanity check
  const bound = SANITY_BOUNDS[pollutant];
  if (bound && value > bound) return null;
  if (value < 0) return null;
  return value;
}

async function extractOpenAQMeasurements({ cities = DEFAULT_CITIES, maxAgeHours = 24 } = {}) {
  let locations;
  try {
    locations = await openAQService.fetchLocations({ country: 'IN', limit: 200 });
  } catch (e) {
    console.warn('[ETL] OpenAQ locations fetch failed:', e.message);
    return [];
  }
  if (!locations.length) return [];

  const stationCutoff = Date.now() - 7 * 24 * 3600 * 1000;        // station active last 7 days
  const readingCutoff = Date.now() - maxAgeHours * 3600 * 1000;   // reading itself within last N hours
  const relevant = locations.filter((loc) => {
    if (!loc.datetimeLast) return false;
    if (new Date(loc.datetimeLast).getTime() < stationCutoff) return false;
    return matchCityFromStation(loc.stationName, cities) != null;
  });
  console.log(`[ETL] OpenAQ: ${relevant.length} active stations matched our cities (of ${locations.length}).`);
  if (!relevant.length) return [];

  /** dedupe key: city|station|pollutant → kept record (freshest) */
  const best = new Map();
  let dropped = { stale: 0, unit: 0, bounds: 0 };
  const batchSize = 5;

  for (let i = 0; i < relevant.length; i += batchSize) {
    const batch = relevant.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((loc) =>
        openAQService.fetchLatestForLocation(loc.externalId)
          .then((rows) => ({ loc, rows }))
          .catch((e) => { console.warn(`[OpenAQ] /latest for ${loc.externalId} failed:`, e.message); return { loc, rows: [] }; })
      )
    );

    for (const { loc, rows } of results) {
      const sensorMeta = {};
      for (const s of (loc.sensors || [])) {
        const p = openAQService.normalizeParam(s.param);
        if (p) sensorMeta[s.id] = { pollutant: p, unit: s.unit };
      }
      const city = matchCityFromStation(loc.stationName, cities);
      if (!city) continue;

      for (const r of rows) {
        const meta = sensorMeta[r.externalSensorId];
        if (!meta) continue;
        if (r.value == null || isNaN(r.value)) continue;

        // Stale reading?
        if (!r.measuredAt || new Date(r.measuredAt).getTime() < readingCutoff) {
          dropped.stale += 1;
          continue;
        }

        const normalized = normalizeReading(meta.pollutant, r.value, meta.unit);
        if (normalized == null) {
          dropped.bounds += 1;
          continue;
        }

        const key = `${city}|${loc.stationName}|${meta.pollutant}`;
        const existing = best.get(key);
        if (!existing || new Date(r.measuredAt) > new Date(existing.measuredAt)) {
          best.set(key, {
            city,
            state: loc.state,
            country: 'India',
            stationName: loc.stationName,
            latitude: loc.latitude,
            longitude: loc.longitude,
            pollutant: meta.pollutant,
            value: Number(normalized.toFixed(2)),
            measuredAt: r.measuredAt,
            source: 'openaq',
          });
        }
      }
    }
  }
  console.log(`[ETL] OpenAQ dropped — stale: ${dropped.stale}, out-of-bounds: ${dropped.bounds}`);
  return Array.from(best.values());
}

/* ----------------------------- Transform ----------------------------- */
function transform(rawRecords = []) {
  return rawRecords
    .filter((r) => r.pollutant && !isNaN(r.value))
    .map((r) => ({
      ...r,
      value: Math.max(0, Number(r.value)),
      city: (r.city || 'Unknown').trim(),
      measuredAt: normalizeTimestamp(r.measuredAt),
    }));
}

function normalizeTimestamp(ts) {
  if (!ts) return new Date().toISOString();
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.toISOString();
  const replaced = String(ts).replace(' ', 'T') + 'Z';
  const d2 = new Date(replaced);
  return isNaN(d2.getTime()) ? new Date().toISOString() : d2.toISOString();
}

/* ------------------------------- Load ------------------------------- */
const insertLocation = db.prepare(`
  INSERT OR IGNORE INTO locations (city, state, country, station_name, latitude, longitude, source)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const findLocation = db.prepare(`
  SELECT location_id FROM locations
  WHERE city = ? AND COALESCE(station_name, '') = COALESCE(?, '')
`);
const findPollutant = db.prepare(`SELECT pollutant_id FROM pollutants WHERE code = ?`);
const insertMeasurement = db.prepare(`
  INSERT OR IGNORE INTO measurements
    (location_id, pollutant_id, value, measured_at, source, raw_payload)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const insertAQI = db.prepare(`
  INSERT OR REPLACE INTO aqi_records
    (location_id, aqi_value, category, dominant_pollutant, temperature, humidity, measured_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertAlert = db.prepare(`
  INSERT INTO alerts (location_id, aqi_value, category, message, triggered_at)
  VALUES (?, ?, ?, ?, ?)
`);

const getLatestPollutants = db.prepare(`
  SELECT p.code, m.value, m.measured_at
  FROM measurements m
  JOIN pollutants p ON p.pollutant_id = m.pollutant_id
  WHERE m.location_id = ?
    AND m.measured_at >= datetime(?, '-1 hour')
  ORDER BY m.measured_at DESC
`);

function load(records) {
  const tx = db.transaction((rows) => {
    let inserted = 0;
    const touchedLocations = new Map();

    for (const r of rows) {
      insertLocation.run(
        r.city,
        r.state || null,
        r.country || 'India',
        r.stationName || null,
        r.latitude || null,
        r.longitude || null,
        r.source || 'manual'
      );
      const loc = findLocation.get(r.city, r.stationName || '');
      if (!loc) continue;

      const pol = findPollutant.get(r.pollutant);
      if (!pol) continue;

      const res = insertMeasurement.run(
        loc.location_id,
        pol.pollutant_id,
        r.value,
        r.measuredAt,
        r.source || 'manual',
        JSON.stringify(r)
      );
      if (res.changes > 0) inserted += 1;
      touchedLocations.set(loc.location_id, r.measuredAt);
    }

    return { inserted, touchedLocations };
  });

  return tx(records);
}

/* ----------------------- AQI computation step ----------------------- */
function recomputeAQIForLocations(locMap) {
  let aqiWritten = 0;
  let alertsWritten = 0;

  for (const [locationId, ts] of locMap.entries()) {
    const rows = getLatestPollutants.all(locationId, ts);
    if (!rows.length) continue;

    const pollutantValues = {};
    let temperature = null;
    let humidity = null;
    for (const row of rows) {
      if (row.code === 'temperature') temperature = row.value;
      else if (row.code === 'humidity') humidity = row.value;
      else if (pollutantValues[row.code] == null) pollutantValues[row.code] = row.value;
    }

    const { aqi, category, dominantPollutant } = calculateAQI(pollutantValues);
    if (aqi == null) continue;

    insertAQI.run(locationId, aqi, category, dominantPollutant, temperature, humidity, ts);
    aqiWritten += 1;

    if (aqi > 300) {
      insertAlert.run(
        locationId,
        aqi,
        category,
        `Hazardous air quality detected (AQI=${aqi}, dominant: ${dominantPollutant})`,
        new Date().toISOString()
      );
      alertsWritten += 1;
    }
  }

  return { aqiWritten, alertsWritten };
}

/* --------------------------- Orchestrator --------------------------- */
async function runFullPipeline({ cities = DEFAULT_CITIES } = {}) {
  const startedAt = new Date().toISOString();
  const runRow = db.prepare(`INSERT INTO etl_runs (started_at, source, status) VALUES (?, ?, ?)`)
    .run(startedAt, 'cpcb+openaq', 'running');
  const runId = runRow.lastInsertRowid;

  try {
    const raw = await extract({ cities });
    const records = transform([...raw.cpcb, ...raw.openaq]);
    const { inserted, touchedLocations } = load(records);
    const { aqiWritten, alertsWritten } = recomputeAQIForLocations(touchedLocations);

    const totalIn = raw.cpcb.length + raw.openaq.length;
    db.prepare(`
      UPDATE etl_runs SET finished_at = ?, records_in = ?, records_out = ?, status = ?
      WHERE run_id = ?
    `).run(new Date().toISOString(), totalIn, inserted, 'success', runId);

    return {
      runId,
      cpcbRecords: raw.cpcb.length,
      openAQRecords: raw.openaq.length,
      inserted,
      aqiWritten,
      alertsWritten,
    };
  } catch (err) {
    db.prepare(`
      UPDATE etl_runs SET finished_at = ?, status = ?, error_message = ?
      WHERE run_id = ?
    `).run(new Date().toISOString(), 'failed', err.message, runId);
    throw err;
  }
}

module.exports = { extract, transform, load, recomputeAQIForLocations, runFullPipeline };
