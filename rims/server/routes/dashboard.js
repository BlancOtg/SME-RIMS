const router = require('express').Router();
const { summary } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', restrictTo('admin', 'accountant'), summary);

module.exports = router;
