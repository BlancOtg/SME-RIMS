const router = require('express').Router();
const { exportInvoices, exportReceipts, exportSummary, exportAging } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect, restrictTo('admin', 'accountant'));

router.get('/invoices', exportInvoices);
router.get('/receipts', exportReceipts);
router.get('/summary',  exportSummary);
router.get('/aging',    exportAging);

module.exports = router;
