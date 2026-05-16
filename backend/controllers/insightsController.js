const db = require('../config/db');

const WHO_LIMITS = {
  pm25: { limit: 15, period: '24h', label: 'PM2.5' },
  pm10: { limit: 45, period: '24h', label: 'PM10' },
  no2:  { limit: 25, period: '24h', label: 'NO₂' },
  so2:  { limit: 40, period: '24h', label: 'SO₂' },
  o3:   { limit: 100, period: '8h',  label: 'O₃' },
  co:   { limit: 4,  period: '24h', label: 'CO' },
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

function cityFilter(city, params) {
  if (city) {
    params.push(city);
    return ' AND l.city = ?';
  }
  return '';
}

/* ===================================================================
   1. /api/insights/hourly-pattern  ?city=Delhi&days=14
   24-hour average AQI profile (which hour of the day is worst on avg).
=================================================================== */
exports.hourlyPattern = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 14, 365));
  const sql = `
    SELECT CAST(strftime('%H', a.measured_at) AS INTEGER) AS hour,
           ROUND(AVG(a.aqi_value), 1) AS avg_aqi,
           COUNT(*) AS samples
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
    GROUP BY hour ORDER BY hour
  `;
  const rows = db.prepare(sql).all(city, `-${days} days`);
  res.json({ city, days, data: rows });
};

/* ===================================================================
   2. /api/insights/weekly-pattern  ?city=Delhi&days=30
   Avg AQI by day-of-week (0=Sun..6=Sat).
=================================================================== */
exports.weeklyPattern = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 30, 365));
  const sql = `
    SELECT CAST(strftime('%w', a.measured_at) AS INTEGER) AS dow,
           ROUND(AVG(a.aqi_value), 1) AS avg_aqi,
           COUNT(*) AS samples
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
    GROUP BY dow ORDER BY dow
  `;
  const rows = db.prepare(sql).all(city, `-${days} days`);
  const NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  res.json({ city, days, data: rows.map((r) => ({ ...r, day: NAMES[r.dow] })) });
};

/* ===================================================================
   3. /api/insights/heatmap  ?city=Delhi&days=30
   Hour x day grid for calendar-style heatmap.
=================================================================== */
exports.heatmap = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 14, 90));
  const sql = `
    SELECT date(a.measured_at) AS day,
           CAST(strftime('%H', a.measured_at) AS INTEGER) AS hour,
           ROUND(AVG(a.aqi_value), 0) AS avg_aqi
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
    GROUP BY day, hour
    ORDER BY day, hour
  `;
  const rows = db.prepare(sql).all(city, `-${days} days`);
  res.json({ city, days, data: rows });
};

/* ===================================================================
   4. /api/insights/multi-pollutant  ?city=Delhi&days=7
   Daily averages for ALL pollutants together (overlay chart).
=================================================================== */
exports.multiPollutant = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 7, 90));
  const sql = `
    SELECT date(m.measured_at) AS day, p.code, p.name, p.unit,
           ROUND(AVG(m.value), 2) AS avg_value
    FROM measurements m
    JOIN pollutants p ON p.pollutant_id = m.pollutant_id
    JOIN locations  l ON l.location_id  = m.location_id
    WHERE l.city = ? AND p.code IN ('pm25','pm10','no2','so2','co','o3')
      AND m.measured_at >= datetime('now', ?)
    GROUP BY day, p.code
    ORDER BY day, p.code
  `;
  const rows = db.prepare(sql).all(city, `-${days} days`);
  res.json({ city, days, data: rows });
};

/* ===================================================================
   5. /api/insights/who-comparison  ?city=Delhi
   Latest 24h pollutant averages vs WHO 2021 guideline values.
=================================================================== */
exports.whoComparison = (req, res) => {
  const city = req.query.city || 'Delhi';
  const sql = `
    SELECT p.code, ROUND(AVG(m.value), 2) AS avg_value
    FROM measurements m
    JOIN pollutants p ON p.pollutant_id = m.pollutant_id
    JOIN locations  l ON l.location_id  = m.location_id
    WHERE l.city = ? AND m.measured_at >= datetime('now', '-1 day')
      AND p.code IN ('pm25','pm10','no2','so2','o3','co')
    GROUP BY p.code
  `;
  const rows = db.prepare(sql).all(city);
  const data = rows.map((r) => {
    const w = WHO_LIMITS[r.code] || {};
    const ratio = w.limit ? Number((r.avg_value / w.limit).toFixed(2)) : null;
    return {
      code: r.code,
      label: w.label || r.code,
      value: r.avg_value,
      who_limit: w.limit ?? null,
      period: w.period ?? null,
      times_over: ratio,
      status: ratio == null ? 'unknown' : ratio <= 1 ? 'within' : 'over',
    };
  });
  res.json({ city, data });
};

/* ===================================================================
   6. /api/insights/today-vs-yesterday  ?city=Delhi
   Plain-language daily delta.
=================================================================== */
exports.todayVsYesterday = (req, res) => {
  const city = req.query.city || 'Delhi';
  const sql = `
    SELECT
      ROUND(AVG(CASE WHEN date(a.measured_at) = date('now')             THEN a.aqi_value END), 1) AS today,
      ROUND(AVG(CASE WHEN date(a.measured_at) = date('now', '-1 day')  THEN a.aqi_value END), 1) AS yesterday,
      ROUND(AVG(CASE WHEN date(a.measured_at) = date('now', '-7 days') THEN a.aqi_value END), 1) AS last_week
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', '-8 days')
  `;
  const r = db.prepare(sql).get(city);
  const diff = (r.today != null && r.yesterday != null) ? Number((r.today - r.yesterday).toFixed(1)) : null;
  const pct  = (r.today != null && r.yesterday) ? Number(((diff / r.yesterday) * 100).toFixed(1)) : null;
  let trend = 'flat';
  if (pct != null) {
    if (pct > 10) trend = 'worse';
    else if (pct < -10) trend = 'better';
  }
  res.json({ city, today: r.today, yesterday: r.yesterday, last_week: r.last_week, diff, pct, trend });
};

/* ===================================================================
   7. /api/insights/distribution  ?city=Delhi&days=30
   Histogram in 50-point AQI bins.
=================================================================== */
exports.distribution = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 30, 365));
  const sql = `
    SELECT (a.aqi_value / 50) * 50 AS bin_start, COUNT(*) AS n
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
    GROUP BY bin_start ORDER BY bin_start
  `;
  const rows = db.prepare(sql).all(city, `-${days} days`);
  res.json({
    city, days,
    data: rows.map((r) => ({
      range: `${r.bin_start}–${r.bin_start + 49}`,
      bin_start: r.bin_start,
      readings: r.n,
      category: aqiCategory(r.bin_start + 25),
    })),
  });
};

/* ===================================================================
   8. /api/insights/extremes  ?city=Delhi&days=14
   Top 5 worst + top 5 cleanest hours.
=================================================================== */
exports.extremes = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 14, 365));
  const worstSql = `
    SELECT a.aqi_value, a.category, a.dominant_pollutant, a.measured_at
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
    ORDER BY a.aqi_value DESC LIMIT 5
  `;
  const bestSql = worstSql.replace('DESC', 'ASC');
  res.json({
    city, days,
    worst: db.prepare(worstSql).all(city, `-${days} days`),
    best:  db.prepare(bestSql).all(city, `-${days} days`),
  });
};

/* ===================================================================
   9. /api/insights/streak  ?city=Delhi
   Current consecutive run of safe (avg ≤ 100) or hazardous (> 200) days.
=================================================================== */
exports.streak = (req, res) => {
  const city = req.query.city || 'Delhi';
  const sql = `
    SELECT date(a.measured_at) AS day, ROUND(AVG(a.aqi_value), 0) AS day_avg
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ?
    GROUP BY day ORDER BY day DESC LIMIT 90
  `;
  const rows = db.prepare(sql).all(city);
  if (rows.length === 0) return res.json({ city, streak: 0, kind: 'none' });

  const isHazardous = (v) => v > 200;
  const isSafe = (v) => v <= 100;
  const first = rows[0].day_avg;
  let kind = isHazardous(first) ? 'hazardous' : isSafe(first) ? 'safe' : 'moderate';
  const test = kind === 'hazardous' ? isHazardous : kind === 'safe' ? isSafe : (v) => v > 100 && v <= 200;

  let streak = 0;
  for (const r of rows) {
    if (test(r.day_avg)) streak += 1;
    else break;
  }
  res.json({ city, streak, kind, latest_day_avg: first });
};

/* ===================================================================
   10. /api/insights/comparison  ?cities=Delhi,Mumbai&days=7
   Side-by-side metric comparison for 2-4 cities.
=================================================================== */
exports.comparison = (req, res) => {
  const cities = (req.query.cities || 'Delhi,Mumbai').split(',').map((c) => c.trim()).filter(Boolean).slice(0, 4);
  const days = Math.max(1, Math.min(Number(req.query.days) || 7, 365));
  if (cities.length < 2) return res.status(400).json({ error: 'Provide at least 2 cities (?cities=A,B)' });

  const placeholders = cities.map(() => '?').join(',');
  const sql = `
    SELECT l.city,
           ROUND(AVG(a.aqi_value), 1) AS avg_aqi,
           MAX(a.aqi_value) AS peak_aqi,
           MIN(a.aqi_value) AS min_aqi,
           SUM(CASE WHEN a.aqi_value > 200 THEN 1 ELSE 0 END) AS hazardous_hours,
           SUM(CASE WHEN a.aqi_value <= 100 THEN 1 ELSE 0 END) AS safe_hours,
           COUNT(*) AS readings
    FROM aqi_records a
    JOIN locations l ON l.location_id = a.location_id
    WHERE l.city IN (${placeholders}) AND a.measured_at >= datetime('now', ?)
    GROUP BY l.city
    ORDER BY avg_aqi DESC
  `;
  const rows = db.prepare(sql).all(...cities, `-${days} days`);
  res.json({ cities, days, data: rows });
};

/* ===================================================================
   11. /api/insights/dominant  ?city=Delhi&days=14
   Which pollutant most often drove the AQI (frequency count).
=================================================================== */
exports.dominantFrequency = (req, res) => {
  const city = req.query.city || 'Delhi';
  const days = Math.max(1, Math.min(Number(req.query.days) || 14, 365));
  const sql = `
    SELECT a.dominant_pollutant AS code, COUNT(*) AS readings
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', ?)
      AND a.dominant_pollutant IS NOT NULL
    GROUP BY a.dominant_pollutant
    ORDER BY readings DESC
  `;
  const rows = db.prepare(sql).all(city, `-${days} days`);
  res.json({ city, days, data: rows });
};

/* ===================================================================
   12. /api/insights/insights  ?city=Delhi
   Plain-English bullets, derived from the queries above.
=================================================================== */
exports.plainEnglishInsights = (req, res) => {
  const city = req.query.city || 'Delhi';
  const insights = [];

  // Today vs yesterday
  const tvy = db.prepare(`
    SELECT
      ROUND(AVG(CASE WHEN date(a.measured_at) = date('now') THEN a.aqi_value END), 0) AS today,
      ROUND(AVG(CASE WHEN date(a.measured_at) = date('now', '-1 day') THEN a.aqi_value END), 0) AS yesterday
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', '-2 days')
  `).get(city);

  if (tvy.today != null && tvy.yesterday != null) {
    const diff = tvy.today - tvy.yesterday;
    if (Math.abs(diff) < 5) {
      insights.push({ icon: 'flat', tone: 'neutral', text: `Today's air is about the same as yesterday (AQI ${tvy.today}).` });
    } else if (diff > 0) {
      const pct = Math.round((diff / tvy.yesterday) * 100);
      insights.push({
        icon: 'up', tone: pct > 30 ? 'bad' : 'warn',
        text: `Air got ${pct}% worse than yesterday (now AQI ${tvy.today}, was ${tvy.yesterday}).`,
      });
    } else {
      const pct = Math.round((-diff / tvy.yesterday) * 100);
      insights.push({
        icon: 'down', tone: 'good',
        text: `Air improved ${pct}% from yesterday (now AQI ${tvy.today}, was ${tvy.yesterday}).`,
      });
    }
  }

  // Worst hour of week
  const worstHr = db.prepare(`
    SELECT CAST(strftime('%H', a.measured_at) AS INTEGER) AS h,
           ROUND(AVG(a.aqi_value), 0) AS avg
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', '-7 days')
    GROUP BY h ORDER BY avg DESC LIMIT 1
  `).get(city);
  if (worstHr) {
    insights.push({
      icon: 'clock', tone: 'warn',
      text: `Pollution peaks around ${String(worstHr.h).padStart(2,'0')}:00 (avg AQI ${worstHr.avg} over the last week). Plan outdoor activity outside this window.`,
    });
  }

  // Most common dominant pollutant
  const dom = db.prepare(`
    SELECT a.dominant_pollutant AS code, COUNT(*) AS n
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', '-7 days')
      AND a.dominant_pollutant IS NOT NULL
    GROUP BY code ORDER BY n DESC LIMIT 1
  `).get(city);
  if (dom) {
    const friendly = {
      pm25: 'fine particulate matter (PM2.5) — comes mostly from vehicle exhaust, cooking fires, and industry',
      pm10: 'coarse dust (PM10) — comes from construction, road dust, and pollen',
      no2:  'nitrogen dioxide — mostly from traffic',
      so2:  'sulphur dioxide — from coal-burning industry',
      co:   'carbon monoxide — vehicle exhaust',
      o3:   'ground-level ozone — forms in sunlight from traffic emissions',
    }[dom.code] || dom.code;
    insights.push({
      icon: 'pollutant', tone: 'info',
      text: `The main problem here is ${friendly}.`,
    });
  }

  // Hazardous readings last week (% of distinct hourly readings)
  const hazard = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN a.aqi_value > 200 THEN 1 ELSE 0 END) AS bad
    FROM aqi_records a JOIN locations l ON l.location_id = a.location_id
    WHERE l.city = ? AND a.measured_at >= datetime('now', '-7 days')
  `).get(city);
  if (hazard && hazard.total > 0) {
    const pctHazard = Math.min(100, Math.round((hazard.bad / hazard.total) * 100));
    if (hazard.bad > 0) {
      insights.push({
        icon: 'warn', tone: pctHazard > 50 ? 'bad' : 'warn',
        text: `${pctHazard}% of last week's readings were "Poor" or worse. Sensitive groups should mask up.`,
      });
    } else {
      insights.push({
        icon: 'good', tone: 'good',
        text: 'No hazardous readings in the past week — great air quality streak!',
      });
    }
  }

  res.json({ city, insights });
};

/* ===================================================================
   13. /api/insights/data-source
   Reports whether DB has any "live" rows (cpcb/openaq) or only synthetic.
=================================================================== */
exports.dataSource = (req, res) => {
  const counts = db.prepare(`
    SELECT source, COUNT(*) AS n FROM measurements
    GROUP BY source
  `).all();
  const total = counts.reduce((s, r) => s + r.n, 0);
  const live = counts.filter((r) => r.source && r.source !== 'synthetic').reduce((s, r) => s + r.n, 0);
  res.json({
    total,
    live_count: live,
    synthetic_count: total - live,
    mode: live > 0 ? (total - live > 0 ? 'mixed' : 'live') : 'synthetic',
    by_source: counts,
  });
};
