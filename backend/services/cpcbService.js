const axios = require('axios');

const BASE = process.env.CPCB_API_BASE || 'https://api.data.gov.in/resource';
const RESOURCE = process.env.CPCB_RESOURCE_ID || '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
const API_KEY = process.env.CPCB_API_KEY || '';

const client = axios.create({ baseURL: BASE, timeout: 15000 });

const POLLUTANT_LOOKUP = {
  'PM2.5': 'pm25',
  PM10: 'pm10',
  NO2: 'no2',
  SO2: 'so2',
  CO: 'co',
  OZONE: 'o3',
  NH3: 'nh3',
};

/**
 * Fetch real-time AQI records from data.gov.in (CPCB feed).
 * Returns flat list with pollutant + value per station.
 */
async function fetchRealtime({ cities = [], limit = 2000 } = {}) {
  if (!API_KEY) {
    console.warn('[CPCB] CPCB_API_KEY not set — returning empty list.');
    return [];
  }

  const params = {
    'api-key': API_KEY,
    format: 'json',
    limit,
    offset: 0,
  };

  const { data } = await client.get(`/${RESOURCE}`, { params });
  const records = data.records || data.data || [];

  const filterSet = new Set(cities.map((c) => c.toLowerCase()));

  return records
    .filter((r) => filterSet.size === 0 || filterSet.has((r.city || '').toLowerCase()))
    .map((r) => ({
      city: r.city,
      state: r.state,
      country: r.country || 'India',
      stationName: r.station,
      latitude: parseFloat(r.latitude) || null,
      longitude: parseFloat(r.longitude) || null,
      pollutant: POLLUTANT_LOOKUP[(r.pollutant_id || '').toUpperCase()] || null,
      value: parseFloat(r.avg_value ?? r.pollutant_avg ?? r.value),
      measuredAt: r.last_update || r.last_updated || new Date().toISOString(),
      source: 'cpcb',
    }))
    .filter((m) => m.pollutant && !isNaN(m.value));
}

module.exports = { fetchRealtime };
