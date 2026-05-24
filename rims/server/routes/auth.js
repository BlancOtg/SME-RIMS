const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.get('/me',        protect,       getMe);

router.post('/forgot-password',
  body('email').isEmail().withMessage('Valid email is required'),
  forgotPassword
);

router.post('/reset-password/:token',
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  resetPassword
);

module.exports = router;
