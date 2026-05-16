const router = require('express').Router();
const c = require('../controllers/alertController');

router.get('/active', c.getActive);
router.get('/history', c.getHistory);
router.post('/dismiss-all', c.acknowledgeAll);
router.post('/:id/acknowledge', c.acknowledge);

module.exports = router;
