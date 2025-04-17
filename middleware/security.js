const csrf = require('csurf');
const helmet = require('helmet');
const xss = require('xss');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced XSS sanitization middleware
const sanitizeInputs = (req, res, next) => {
  // Sanitize request body fields
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // More comprehensive XSS sanitization
        req.body[key] = xss(req.body[key].trim(), {
          whiteList: [], // Strip all HTML tags
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
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

// Enhanced Helmet configuration
const enhancedHelmet = () => helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        'https://cdn.jsdelivr.net/', 
        'https://cdnjs.cloudflare.com/',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.4.2/mdb.min.js'
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        'https://cdn.jsdelivr.net/', 
        'https://cdnjs.cloudflare.com/',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.4.2/mdb.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
      ],
      fontSrc: [
        "'self'", 
        "'self'", 
        'https://cdnjs.cloudflare.com/',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/',
        'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/fonts/',
        'https://cdnjs.cloudflare.com/',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/'
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  hidePoweredBy: true // Remove X-Powered-By header
});

// Comprehensive input validation for registration
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters')
    .escape(), // Prevent XSS
  
  body('email')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false
    }),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .toLowerCase(), // Normalize username
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character')
];

// Validation for login with additional security
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Invalid username')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Invalid password')
];

// Course validation with enhanced checks
const validateCourse = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters')
    .escape(), // Prevent XSS
  
  body('instructor')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Instructor name required')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Instructor name can only contain letters')
    .escape(),
  
  body('date')
    .trim()
    .isISO8601().withMessage('Invalid date format')
    .toDate(), // Convert to date object
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters')
    .escape(),
  
  body('price')
    .isFloat({ min: 0, max: 1000 }).withMessage('Price must be between 0 and 1000')
    .toFloat(),
  
  body('capacity')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 50 }).withMessage('Capacity must be between 1 and 50')
    .toInt()
];

// Enhanced booking validation
const validateBooking = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters')
    .escape(),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false
    })
];

// Validate route parameters
const validateParams = {
  courseId: param('id')
    .isLength({ min: 3 })
    .withMessage('Invalid course ID format')
    .escape(),
    
  bookingId: param('id')
    .isLength({ min: 3 })
    .withMessage('Invalid booking ID format')
    .escape(),
    
  username: param('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid username format')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric')
    .escape()
};

// Process validation errors with detailed handling
const processValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array()[0].msg;
    
    console.log('Validation errors detected:', errors.array());
    
    // Check for AJAX request in multiple ways
    const isAjax = req.xhr || 
                  req.headers.accept?.includes('application/json') ||
                  req.headers['content-type']?.includes('application/json') ||
                  req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    console.log('Is XHR request:', isAjax);
    
    if (isAjax) {
      return res.status(400).json({ error: errorMsg });
    }
    
    // Context-aware error rendering
    const renderErrorMap = {
      '/register': 'register',
      '/login': 'login',
      '/reset-password': 'reset-password',
      '/courses/add': 'add-course',
      '/courses/edit': 'edit-course',
      '/book': 'book-course'
    };

    const matchedRoute = Object.keys(renderErrorMap).find(route => 
      req.originalUrl.includes(route)
    );

    if (matchedRoute) {
      return res.status(400).render(renderErrorMap[matchedRoute], { 
        error: errorMsg,
        ...(req.body && { course: req.body }),
        csrfToken: req.csrfToken() 
      });
    }

    // Fallback error handling
    return res.status(400).redirect('back');
  }
  next();
};

// Validate password reset
const validatePasswordReset = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail()
];

// Validate new password
const validateNewPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

module.exports = {
  limiter,
  csrfProtection: csrf({ cookie: true }),
  helmet: enhancedHelmet,
  sanitizeInputs,
  validateRegistration,
  validateLogin,
  validateCourse,
  validateBooking,
  validatePasswordReset,
  validateNewPassword,
  validateParams,
  processValidationErrors
};