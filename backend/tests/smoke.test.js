/**
 * Smoke tests for the AQI Dashboard API.
 * Run with: npm test
 *
 * Uses Node's built-in test runner. Boots the Express app in-process
 * and hits each public endpoint with no external dependencies.
 */
require('dotenv').config();
process.env.NODE_ENV = 'test';

const { test, before } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const app = require('../server');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(baseUrl + path, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, json: null, raw: body }); }
      });
    }).on('error', reject);
  });
}

test('GET / returns API metadata', async () => {
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.endpoints));
});

test('GET /api/health reports OK', async () => {
  const r = await get('/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'ok');
});

test('GET /api/locations returns data array', async () => {
  const r = await get('/api/locations');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
});

test('GET /api/air-quality/latest returns latest AQI per city', async () => {
  const r = await get('/api/air-quality/latest');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
});

test('GET /api/kpi/summary returns summary block', async () => {
  const r = await get('/api/kpi/summary?days=7');
  assert.equal(r.status, 200);
  assert.ok(r.json.summary);
});

test('GET /api/kpi/city-ranking returns array', async () => {
  const r = await get('/api/kpi/city-ranking?days=7');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.data));
});

test('AQI calculator: 0 PM2.5 -> Good', () => {
  const { calculateAQI } = require('../services/aqiCalculator');
  const r = calculateAQI({ pm25: 0 });
  assert.equal(r.category, 'Good');
  assert.equal(r.aqi, 0);
});

test('AQI calculator: high PM2.5 -> Severe', () => {
  const { calculateAQI } = require('../services/aqiCalculator');
  const r = calculateAQI({ pm25: 300 });
  assert.equal(r.category, 'Severe');
  assert.ok(r.aqi >= 401 && r.aqi <= 500);
});

test('AQI calculator: PM2.5=200 -> Very Poor', () => {
  const { calculateAQI } = require('../services/aqiCalculator');
  const r = calculateAQI({ pm25: 200 });
  assert.equal(r.category, 'Very Poor');
  assert.ok(r.aqi >= 301 && r.aqi <= 400);
});

test.after(() => { server?.close(); });
