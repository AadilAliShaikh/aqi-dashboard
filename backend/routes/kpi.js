const router = require('express').Router();
const c = require('../controllers/kpiController');

router.get('/summary', c.getSummary);
router.get('/pollutant-breakdown', c.getPollutantBreakdown);
router.get('/category-distribution', c.getCategoryDistribution);
router.get('/city-ranking', c.getCityRanking);

module.exports = router;
