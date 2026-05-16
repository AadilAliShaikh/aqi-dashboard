const router = require('express').Router();
const c = require('../controllers/airQualityController');

router.get('/', c.getMeasurements);
router.get('/latest', c.getLatest);
router.get('/latest-by-city', c.getLatestByCity);
router.get('/trends', c.getTrends);
router.get('/aqi-trend', c.getAqiTrend);

module.exports = router;
