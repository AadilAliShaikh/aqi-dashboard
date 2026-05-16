require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');

const db = require('./config/db');
const airQualityRoutes = require('./routes/airQuality');
const kpiRoutes = require('./routes/kpi');
const forecastRoutes = require('./routes/forecast');
const alertRoutes = require('./routes/alerts');
const locationRoutes = require('./routes/locations');
const insightsRoutes = require('./routes/insights');
const etlService = require('./services/etlService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    name: 'AQI Dashboard API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      '/api/health',
      '/api/locations',
      '/api/air-quality',
      '/api/air-quality/latest',
      '/api/air-quality/trends',
      '/api/kpi/summary',
      '/api/kpi/pollutant-breakdown',
      '/api/forecast/:city',
      '/api/alerts/active',
      '/api/etl/run'
    ]
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = db.prepare('SELECT COUNT(*) AS c FROM measurements').get();
  res.json({
    status: 'ok',
    db: 'connected',
    measurements: dbStatus.c,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/locations', locationRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/insights', insightsRoutes);

app.post('/api/etl/run', async (req, res) => {
  try {
    const result = await etlService.runFullPipeline();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

const cronExpr = process.env.INGEST_CRON || '0 */1 * * *';
if (cron.validate(cronExpr) && process.env.NODE_ENV !== 'test') {
  cron.schedule(cronExpr, async () => {
    console.log('[CRON] Running scheduled ETL ingestion...');
    try {
      const r = await etlService.runFullPipeline();
      console.log('[CRON] Done:', r);
    } catch (e) {
      console.error('[CRON] Failed:', e.message);
    }
  });
  console.log(`[CRON] Scheduled ETL with cron "${cronExpr}"`);
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AQI Dashboard API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
