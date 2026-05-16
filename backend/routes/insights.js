const router = require('express').Router();
const c = require('../controllers/insightsController');

router.get('/hourly-pattern',     c.hourlyPattern);
router.get('/weekly-pattern',     c.weeklyPattern);
router.get('/heatmap',            c.heatmap);
router.get('/multi-pollutant',    c.multiPollutant);
router.get('/who-comparison',     c.whoComparison);
router.get('/today-vs-yesterday', c.todayVsYesterday);
router.get('/distribution',       c.distribution);
router.get('/extremes',           c.extremes);
router.get('/streak',             c.streak);
router.get('/comparison',         c.comparison);
router.get('/dominant',           c.dominantFrequency);
router.get('/insights',           c.plainEnglishInsights);
router.get('/data-source',        c.dataSource);

module.exports = router;
