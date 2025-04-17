const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { 
  helmet, 
  sanitizeInputs, 
  limiter, 
  csrfProtection 
} = require('./middleware/security');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Apply rate limiting to all requests
app.use(limiter);

// Security middleware
app.use(helmet());
app.use(cookieParser());

// Mustache templating setup with partials
app.engine('mustache', mustacheExpress(path.join(__dirname, 'views', 'partials')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration with enhanced security
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true, // Prevent client-side JavaScript from accessing cookies
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Check for SESSION_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
console.error('ERROR: SESSION_SECRET is not set in production environment!');
console.error('This is a critical security issue. Shutting down server.');
process.exit(1); // Exit with error
}

// CSRF Protection
app.use(csrfProtection);

// Sanitize all inputs to prevent XSS
app.use(sanitizeInputs);

// Inject CSRF token and user info to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  
  // Add CSRF token to all views
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  
  next();
});

// Route setup
const courseRoutes = require('./routes/courseRoutes');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const organiserRoutes = require('./routes/organiserRoutes');

app.use('/courses', courseRoutes);
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', bookingRoutes);
app.use('/', organiserRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you requested could not be found.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle CSRF token errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', {
      title: 'Security Error',
      message: 'The form has expired. Please try again.'
    });
  }
  
  // Generic server error
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end.'
  });
});

// Server startup
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;