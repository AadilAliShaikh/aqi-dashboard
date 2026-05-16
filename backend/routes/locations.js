const router = require('express').Router();
const c = require('../controllers/locationController');

router.get('/', c.getAllLocations);
router.get('/cities', c.getCities);

module.exports = router;
