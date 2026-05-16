const axios = require('axios');

const BASE = process.env.OPENAQ_API_BASE || 'https://api.openaq.org/v3';
const API_KEY = process.env.OPENAQ_API_KEY || '';

const client = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
});

const PARAM_MAP = {
  pm25: 'pm25',
  'pm2.5': 'pm25',
  pm10: 'pm10',
  no2: 'no2',
  so2: 'so2',
  co: 'co',
  o3: 'o3',
  nh3: 'nh3',
  temperature: 'temperature',
  humidity: 'relativehumidity',
};

function normalizeParam(p) {
  if (!p) return null;
  return PARAM_MAP[p.toLowerCase()] || null;
}

async function fetchLocations({ country = 'IN', limit = 200, city = null } = {}) {
  if (!API_KEY) {
    console.warn('[OpenAQ] OPENAQ_API_KEY not set — returning empty list.');
    return [];
  }
  const params = { iso: country, limit };
  if (city) params.city = city;

  const { data } = await client.get('/locations', { params });
  return (data.results || []).map((loc) => ({
    externalId: String(loc.id),
    city: loc.locality || loc.name || 'Unknown',
    state: null,
    country: loc.country?.code || country,
    stationName: loc.name,
    latitude: loc.coordinates?.latitude ?? null,
    longitude: loc.coordinates?.longitude ?? null,
    source: 'openaq',
    datetimeLast: loc.datetimeLast?.utc ?? null,
    sensors: (loc.sensors || []).map((s) => ({
      id: s.id,
      param: s.parameter?.name,
      unit: s.parameter?.units,
    })),
  }));
}

async function fetchLatestForLocation(externalId) {
  if (!API_KEY) return [];
  const { data } = await client.get(`/locations/${externalId}/latest`);
  return (data.results || []).map((r) => ({
    externalSensorId: r.sensorsId,
    value: r.value,
    measuredAt: r.datetime?.utc,
    parameter: null,
  }));
}

async function fetchSensorMeasurements(sensorId, { dateFrom, dateTo, limit = 500 } = {}) {
  if (!API_KEY) return [];
  const params = { limit };
  if (dateFrom) params.datetime_from = dateFrom;
  if (dateTo) params.datetime_to = dateTo;
  const { data } = await client.get(`/sensors/${sensorId}/measurements`, { params });
  return (data.results || []).map((m) => ({
    value: m.value,
    measuredAt: m.period?.datetimeFrom?.utc || m.period?.datetimeTo?.utc,
  }));
}

module.exports = {
  fetchLocations,
  fetchLatestForLocation,
  fetchSensorMeasurements,
  normalizeParam,
};
