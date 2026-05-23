const router = require('express').Router();
const { body } = require('express-validator');
const {
  list, create, getOne, update, updateStatus, recordPayment, remove,
} = require('../controllers/invoiceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// Validation shared between create and update
const itemRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Item quantity must be positive'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be non-negative'),
];

const bodyRules = [
  body('clientSnapshot.name').trim().notEmpty().withMessage('Client name is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be non-negative'),
  ...itemRules,
];

router.get('/',    list);
router.post('/',   restrictTo('admin', 'accountant'), bodyRules, create);
router.get('/:id', getOne);
router.put('/:id', restrictTo('admin', 'accountant'), bodyRules, update);

router.patch('/:id/status',
  restrictTo('admin', 'accountant'),
  body('status').notEmpty().withMessage('Status is required'),
  updateStatus
);

router.patch('/:id/payment',
  restrictTo('admin', 'accountant'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be a positive number'),
  recordPayment
);

router.delete('/:id', restrictTo('admin', 'accountant'), remove);

module.exports = router;
