const db = require('../config/db');
const forecastService = require('../services/forecastService');

exports.forecastCity = (req, res) => {
  const { city } = req.params;
  const horizon = Math.max(1, Math.min(Number(req.query.horizon) || 6, 48));
  const window = Math.max(3, Math.min(Number(req.query.window) || 48, 500));

  const loc = db.prepare(`
    SELECT location_id FROM locations WHERE city = ?
    ORDER BY (SELECT COUNT(*) FROM measurements m WHERE m.location_id = locations.location_id) DESC
    LIMIT 1
  `).get(city);
  if (!loc) return res.status(404).json({ error: `No location for city "${city}"` });

  const result = forecastService.forecastForLocation(loc.location_id, horizon, window);
  res.json({ city, ...result });
};
