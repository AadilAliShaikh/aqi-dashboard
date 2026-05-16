const router = require('express').Router();
const c = require('../controllers/forecastController');

router.get('/:city', c.forecastCity);

module.exports = router;
