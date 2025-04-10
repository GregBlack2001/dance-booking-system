const csrf = require('csurf');
const helmet = require('helmet');
const xss = require('xss');
const { check, validationResult } = require('express-validator');

// Initialize CSRF protection
const csrfProtection = csrf({ cookie: true });

// Sanitize middleware for XSS protection
const sanitizeInputs = (req, res, next) => {
  // Sanitize request body fields
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    });
  }
  
  // Sanitize request query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key].trim());
      }
    });
  }
  
  next();
};

// Validation for registration
const validateRegistration = [
  check('name')
    .trim()
    .not().isEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  check('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  check('username')
    .trim()
    .not().isEmpty().withMessage('Username is required')
    .isAlphanumeric().withMessage('Username can only contain letters and numbers')
    .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
  
  check('password')
    .trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character')
];

// Validation for login
const validateLogin = [
  check('username')
    .trim()
    .not().isEmpty().withMessage('Username is required'),
  
  check('password')
    .not().isEmpty().withMessage('Password is required')
];

// Course validation
const validateCourse = [
  check('title')
    .trim()
    .not().isEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  check('instructor')
    .trim()
    .not().isEmpty().withMessage('Instructor name is required'),
  
  check('date')
    .trim()
    .not().isEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Please provide a valid date'),
  
  check('description')
    .trim()
    .not().isEmpty().withMessage('Description is required'),
  
  check('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  check('capacity')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Capacity must be a positive number')
];

// Booking validation
const validateBooking = [
  check('name')
    .trim()
    .not().isEmpty().withMessage('Name is required'),
  
  check('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Password reset validation
const validatePasswordReset = [
  check('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

// New password validation
const validateNewPassword = [
  check('password')
    .trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
  
  check('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Process validation errors
const processValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Get the first error message
    const errorMsg = errors.array()[0].msg;
    
    // If this is an AJAX request
    if (req.xhr) {
      return res.status(400).json({ error: errorMsg });
    }
    
    // For regular form submissions - store in flash and redirect back
    // We'll set a local variable that can be accessed in the template
    res.locals.error = errorMsg;
    
    // Different redirects based on the route
    if (req.originalUrl.includes('/register')) {
      return res.render('register', { error: errorMsg });
    } else if (req.originalUrl.includes('/login')) {
      return res.render('login', { error: errorMsg });
    } else if (req.originalUrl.includes('/reset-password')) {
      return res.render('reset-password', { error: errorMsg });
    } else if (req.originalUrl.includes('/courses/add') || req.originalUrl.includes('/courses/edit')) {
      return res.render(req.originalUrl.includes('/add') ? 'add-course' : 'edit-course', { 
        error: errorMsg,
        course: req.body
      });
    } else if (req.originalUrl.includes('/book/')) {
      // For booking form
      const courseId = req.params.id;
      return res.redirect(`/book/${courseId}`);
    } else {
      // General fallback
      return res.redirect('back');
    }
  }
  next();
};

module.exports = {
  helmet,
  csrfProtection,
  sanitizeInputs,
  validateRegistration,
  validateLogin,
  validateCourse,
  validateBooking,
  validatePasswordReset,
  validateNewPassword,
  processValidationErrors
};