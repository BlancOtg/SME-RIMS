const router = require('express').Router();
const { body } = require('express-validator');
const {
  list, create, getOne, update, updateOcr, confirmOcr, remove,
} = require('../controllers/receiptController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

const bodyRules = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a non-negative number'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').isIn(['expense', 'income']).withMessage('Type must be expense or income'),
  body('category').optional().isIn([
    'office_supplies', 'utilities', 'transport', 'meals',
    'software', 'hardware', 'rent', 'salaries',
    'marketing', 'professional_services', 'other',
  ]).withMessage('Invalid category'),
  body('paymentMethod').optional().isIn([
    'cash', 'bank_transfer', 'card', 'mobile_money', 'cheque', 'other',
  ]).withMessage('Invalid payment method'),
  body('taxAmount').optional().isFloat({ min: 0 }).withMessage('Tax amount must be non-negative'),
];

router.get('/',    list);
router.post('/',   restrictTo('admin', 'accountant'), bodyRules, create);
router.get('/:id', getOne);
router.put('/:id', restrictTo('admin', 'accountant'), bodyRules, update);

router.patch('/:id/ocr',
  restrictTo('admin', 'accountant'),
  body('confidence').optional().isFloat({ min: 0, max: 100 }).withMessage('Confidence must be 0–100'),
  body('status').optional().isIn(['pending', 'processing', 'processed', 'needs_review', 'confirmed']),
  updateOcr
);

router.patch('/:id/confirm',
  restrictTo('admin', 'accountant'),
  body('amount').optional().isFloat({ min: 0 }),
  body('date').optional().isISO8601(),
  confirmOcr
);

router.delete('/:id', restrictTo('admin', 'accountant'), remove);

module.exports = router;
