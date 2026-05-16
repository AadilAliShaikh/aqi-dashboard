const db = require('../config/db');

/**
 * GET /api/air-quality
 *   ?city=Delhi&pollutant=pm25&from=ISO&to=ISO&limit=500
 *
 * Returns measurements joined with location & pollutant.
 */
exports.getMeasurements = (req, res) => {
  const { city, pollutant, from, to, limit = 500 } = req.query;
  const conditions = [];
  const params = [];

  if (city) { conditions.push('l.city = ?'); params.push(city); }
  if (pollutant) { conditions.push('p.code = ?'); params.push(pollutant); }
  if (from) { conditions.push('m.measured_at >= ?'); params.push(from); }
  if (to) { conditions.push('m.measured_at <= ?'); params.push(to); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT m.measurement_id, l.city, l.station_name, p.code AS pollutant, p.name AS pollutant_name,
           p.unit, m.value, m.measured_at, m.source
    FROM measurements m
    JOIN locations l ON l.location_id = m.location_id
    JOIN pollutants p ON p.pollutant_id = m.pollutant_id
    ${where}
    ORDER BY m.measured_at DESC
    LIMIT ?
  `;
  params.push(Math.min(Number(limit) || 500, 5000));
  res.json({ data: db.prepare(sql).all(...params) });
};

/**
 * GET /api/air-quality/latest
 * Latest AQI snapshot per city (used by overview cards).
 */
exports.getLatest = (req, res) => {
  const { category, city } = req.query;
  let sql = `
    SELECT l.city, l.state, l.station_name, a.aqi_value, a.category, a.dominant_pollutant,
           a.temperature, a.humidity, a.measured_at
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    JOIN (
      SELECT location_id, MAX(measured_at) AS m
      FROM aqi_records GROUP BY location_id
    ) latest ON latest.location_id = a.location_id AND latest.m = a.measured_at
  `;
  const params = [];
  const where = [];
  if (city) { where.push('l.city = ?'); params.push(city); }
  if (category) { where.push('a.category = ?'); params.push(category); }
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY a.aqi_value DESC';
  res.json({ data: db.prepare(sql).all(...params) });
};

/**
 * GET /api/air-quality/trends
 *   ?city=Delhi&pollutant=pm25&days=7
 * Time-series of daily averages for charting trend lines.
 */
exports.getTrends = (req, res) => {
  const { city = 'Delhi', pollutant = 'pm25', days = 7 } = req.query;
  const sql = `
    SELECT date(m.measured_at) AS day,
           AVG(m.value) AS avg_value,
           MIN(m.value) AS min_value,
           MAX(m.value) AS max_value,
           COUNT(*) AS samples
    FROM measurements m
    JOIN locations l ON l.location_id = m.location_id
    JOIN pollutants p ON p.pollutant_id = m.pollutant_id
    WHERE l.city = ? AND p.code = ?
      AND m.measured_at >= datetime('now', ?)
    GROUP BY date(m.measured_at)
    ORDER BY day ASC
  `;
  const interval = `-${Math.max(1, Math.min(Number(days), 365))} days`;
  res.json({
    city, pollutant, days: Number(days),
    data: db.prepare(sql).all(city, pollutant, interval),
  });
};

/**
 * GET /api/air-quality/aqi-trend
 *   ?city=Delhi&days=7
 * AQI time-series for a city — aggregated to one point per hour
 * across all the city's monitoring stations. Prevents zigzag artefacts
 * from many stations reporting at the same timestamp.
 */
exports.getAqiTrend = (req, res) => {
  const { city = 'Delhi', days = 7 } = req.query;
  const interval = `-${Math.max(1, Math.min(Number(days), 365))} days`;
  const sql = `
    SELECT
      strftime('%Y-%m-%dT%H:00:00Z', a.measured_at) AS measured_at,
      ROUND(AVG(a.aqi_value), 0)                    AS aqi_value,
      ROUND(MIN(a.aqi_value), 0)                    AS min_aqi,
      ROUND(MAX(a.aqi_value), 0)                    AS max_aqi,
      COUNT(*)                                      AS stations
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
    GROUP BY strftime('%Y-%m-%dT%H', a.measured_at)
    ORDER BY measured_at ASC
  `;
  res.json({ city, days: Number(days), data: db.prepare(sql).all(city, interval) });
};

/**
 * GET /api/air-quality/latest-by-city
 *   ?category=Poor   (optional)
 * One row per city — AQI averaged across its currently-reporting stations.
 * This is what the "All cities live snapshot" + headline gauge should use.
 */
exports.getLatestByCity = (req, res) => {
  const { category } = req.query;
  const sql = `
    WITH per_loc_latest AS (
      SELECT l.city, a.aqi_value, a.dominant_pollutant, a.measured_at,
             a.temperature, a.humidity
      FROM aqi_records a
      JOIN locations l ON l.location_id = a.location_id
      JOIN (
        SELECT location_id, MAX(measured_at) AS m
        FROM aqi_records GROUP BY location_id
      ) latest ON latest.location_id = a.location_id AND latest.m = a.measured_at
    ),
    dom AS (
      SELECT city, dominant_pollutant, COUNT(*) AS n,
             ROW_NUMBER() OVER (PARTITION BY city ORDER BY COUNT(*) DESC) AS rn
      FROM per_loc_latest
      WHERE dominant_pollutant IS NOT NULL
      GROUP BY city, dominant_pollutant
    )
    SELECT
      p.city,
      ROUND(AVG(p.aqi_value), 0) AS aqi_value,
      MIN(p.aqi_value)           AS min_aqi,
      MAX(p.aqi_value)           AS max_aqi,
      COUNT(*)                   AS stations,
      MAX(p.measured_at)         AS measured_at,
      ROUND(AVG(p.temperature),1) AS temperature,
      ROUND(AVG(p.humidity),1)   AS humidity,
      (SELECT dominant_pollutant FROM dom WHERE dom.city = p.city AND dom.rn = 1) AS dominant_pollutant
    FROM per_loc_latest p
    GROUP BY p.city
    ORDER BY aqi_value DESC
  `;
  let rows = db.prepare(sql).all();
  rows = rows.map((r) => ({ ...r, category: aqiCategory(r.aqi_value) }));
  if (category) rows = rows.filter((r) => r.category === category);
  res.json({ data: rows });
};

function aqiCategory(v) {
  if (v == null) return 'Unknown';
  if (v <= 50)  return 'Good';
  if (v <= 100) return 'Satisfactory';
  if (v <= 200) return 'Moderate';
  if (v <= 300) return 'Poor';
  if (v <= 400) return 'Very Poor';
  return 'Severe';
}
