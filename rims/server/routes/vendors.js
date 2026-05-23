const router = require('express').Router();
const { body } = require('express-validator');
const { list, create, getOne, update, updateBalance, remove } = require('../controllers/vendorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

const bodyRules = [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('paymentStatus').optional().isIn(['Good', 'Late', 'Dispute']).withMessage('Invalid payment status'),
  body('category').optional().isIn([
    'supplies', 'services', 'utilities', 'logistics',
    'technology', 'professional', 'financial', 'other',
  ]).withMessage('Invalid category'),
];

router.get('/',    list);
router.post('/',   restrictTo('admin', 'accountant'), bodyRules, create);
router.get('/:id', getOne);
router.put('/:id', restrictTo('admin', 'accountant'), bodyRules, update);

router.patch('/:id/balance',
  restrictTo('admin', 'accountant'),
  body('balance').isFloat({ min: 0 }).withMessage('Balance must be non-negative'),
  updateBalance
);

router.delete('/:id', restrictTo('admin'), remove);

module.exports = router;
