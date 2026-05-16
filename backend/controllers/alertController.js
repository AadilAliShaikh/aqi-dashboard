const db = require('../config/db');

/**
 * GET /api/alerts/active  -> latest unacknowledged hazardous events.
 * GET /api/alerts/history ?limit=50  -> alert log.
 */
exports.getActive = (req, res) => {
  const sql = `
    SELECT a.alert_id, l.city, l.station_name, a.aqi_value, a.category, a.message, a.triggered_at
    FROM alerts a
    JOIN locations l ON l.location_id = a.location_id
    WHERE a.acknowledged = 0
    ORDER BY a.triggered_at DESC
    LIMIT 100
  `;
  res.json({ data: db.prepare(sql).all() });
};

exports.getHistory = (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const sql = `
    SELECT a.alert_id, l.city, a.aqi_value, a.category, a.message, a.triggered_at, a.acknowledged
    FROM alerts a
    JOIN locations l ON l.location_id = a.location_id
    ORDER BY a.triggered_at DESC LIMIT ?
  `;
  res.json({ data: db.prepare(sql).all(limit) });
};

exports.acknowledge = (req, res) => {
  const { id } = req.params;
  const r = db.prepare(`UPDATE alerts SET acknowledged = 1 WHERE alert_id = ?`).run(id);
  res.json({ ok: r.changes > 0 });
};

exports.acknowledgeAll = (req, res) => {
  const r = db.prepare(`UPDATE alerts SET acknowledged = 1 WHERE acknowledged = 0`).run();
  res.json({ ok: true, dismissed: r.changes });
};
