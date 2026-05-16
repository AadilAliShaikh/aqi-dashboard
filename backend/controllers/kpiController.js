const db = require('../config/db');

/**
 * GET /api/kpi/summary  ?city=Delhi&days=30
 * High-level KPIs for an overview row.
 */
exports.getSummary = (req, res) => {
  const { city, days = 30 } = req.query;
  const interval = `-${Math.max(1, Math.min(Number(days), 365))} days`;

  const cityFilter = city ? 'AND l.city = ?' : '';
  const params = [interval];
  if (city) params.push(city);

  const sql = `
    SELECT
      ROUND(AVG(a.aqi_value), 1)  AS avg_aqi,
      MAX(a.aqi_value)            AS peak_aqi,
      MIN(a.aqi_value)            AS min_aqi,
      COUNT(DISTINCT date(a.measured_at)) AS days_recorded,
      SUM(CASE WHEN a.aqi_value <= 100 THEN 1 ELSE 0 END) AS safe_hours,
      SUM(CASE WHEN a.aqi_value > 300 THEN 1 ELSE 0 END)  AS hazardous_hours,
      COUNT(*) AS total_readings
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE a.measured_at >= datetime('now', ?) ${cityFilter}
  `;
  const summary = db.prepare(sql).get(...params);

  const peakHourSql = `
    SELECT strftime('%H', a.measured_at) AS hour,
           ROUND(AVG(a.aqi_value), 1) AS avg_aqi
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE a.measured_at >= datetime('now', ?) ${cityFilter}
    GROUP BY hour ORDER BY avg_aqi DESC LIMIT 1
  `;
  const peakHour = db.prepare(peakHourSql).get(...params);

  res.json({ city: city || 'all', days: Number(days), summary, peakHour });
};

/**
 * GET /api/kpi/pollutant-breakdown ?city=Delhi&days=30
 */
exports.getPollutantBreakdown = (req, res) => {
  const { city, days = 30 } = req.query;
  const interval = `-${Math.max(1, Math.min(Number(days), 365))} days`;
  const cityFilter = city ? 'AND l.city = ?' : '';
  const params = [interval];
  if (city) params.push(city);

  const sql = `
    SELECT p.code, p.name, p.unit, p.safe_threshold,
           ROUND(AVG(m.value), 2) AS avg_value,
           ROUND(MAX(m.value), 2) AS peak_value,
           COUNT(*) AS samples
    FROM measurements m
    JOIN pollutants p ON p.pollutant_id = m.pollutant_id
    JOIN locations l ON l.location_id = m.location_id
    WHERE m.measured_at >= datetime('now', ?) ${cityFilter}
      AND p.code NOT IN ('temperature','humidity')
    GROUP BY p.code
    ORDER BY p.code
  `;
  res.json({ city: city || 'all', days: Number(days), data: db.prepare(sql).all(...params) });
};

/**
 * GET /api/kpi/category-distribution ?city=Delhi&days=30
 * Counts of AQI categories — drives the donut chart.
 */
exports.getCategoryDistribution = (req, res) => {
  const { city, days = 30 } = req.query;
  const interval = `-${Math.max(1, Math.min(Number(days), 365))} days`;
  const cityFilter = city ? 'AND l.city = ?' : '';
  const params = [interval];
  if (city) params.push(city);

  const sql = `
    SELECT a.category, COUNT(*) AS readings
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE a.measured_at >= datetime('now', ?) ${cityFilter}
    GROUP BY a.category
    ORDER BY readings DESC
  `;
  res.json({ city: city || 'all', days: Number(days), data: db.prepare(sql).all(...params) });
};

/**
 * GET /api/kpi/city-ranking ?days=7
 * Cities ranked by mean AQI (worst-first) for the leaderboard widget.
 */
exports.getCityRanking = (req, res) => {
  const { days = 7 } = req.query;
  const interval = `-${Math.max(1, Math.min(Number(days), 365))} days`;
  const sql = `
    SELECT l.city,
           ROUND(AVG(a.aqi_value), 1) AS avg_aqi,
           MAX(a.aqi_value) AS peak_aqi,
           SUM(CASE WHEN a.aqi_value > 300 THEN 1 ELSE 0 END) AS hazardous_hours
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE a.measured_at >= datetime('now', ?)
    GROUP BY l.city
    ORDER BY avg_aqi DESC
  `;
  res.json({ days: Number(days), data: db.prepare(sql).all(interval) });
};
