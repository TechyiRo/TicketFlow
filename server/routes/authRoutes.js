const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Apply rate limiting to all auth endpoints (max 10 requests per 15 mins per IP, relaxed in dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  message: { message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

// Zod-equivalent express-validator rules
const registerUserValidation = [
  body('fullName')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('username')
    .isAlphanumeric()
    .withMessage('Username must contain alphanumeric characters only')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one number, and one special character'),
  body('avatar')
    .notEmpty()
    .withMessage('Please select an avatar.'),
  body('companyName')
    .isLength({ min: 2 })
    .withMessage('Company name must be at least 2 characters'),
  body('companyAddress')
    .notEmpty()
    .withMessage('Company address is required'),
  body('contactNumber')
    .isLength({ min: 10 })
    .withMessage('Contact number must be at least 10 digits'),
  body('companyEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please enter a valid company email'),
];

const registerEmployeeValidation = [
  body('fullName')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('username')
    .isAlphanumeric()
    .withMessage('Username must contain alphanumeric characters only')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one number, and one special character'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
];

const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post(
  '/register/user',
  upload.single('logo'),
  registerUserValidation,
  validateRequest,
  authController.registerUser
);

router.post(
  '/register/employee',
  registerEmployeeValidation,
  validateRequest,
  authController.registerEmployee
);

router.post('/login/user', loginValidation, validateRequest, authController.loginUser);
router.post('/login/employee', loginValidation, validateRequest, authController.loginEmployee);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
