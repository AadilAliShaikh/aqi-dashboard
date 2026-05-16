const db = require('../config/db');

const listAll = db.prepare(`
  SELECT l.location_id, l.city, l.state, l.country, l.station_name,
         l.latitude, l.longitude, l.source,
         (SELECT COUNT(*) FROM measurements m WHERE m.location_id = l.location_id) AS measurement_count,
         (SELECT a.aqi_value FROM aqi_records a WHERE a.location_id = l.location_id
            ORDER BY a.measured_at DESC LIMIT 1) AS latest_aqi
  FROM locations l
  ORDER BY l.city
`);

const listCities = db.prepare(`
  SELECT DISTINCT city FROM locations ORDER BY city
`);

exports.getAllLocations = (req, res) => {
  res.json({ data: listAll.all() });
};

exports.getCities = (req, res) => {
  res.json({ data: listCities.all().map((r) => r.city) });
};
