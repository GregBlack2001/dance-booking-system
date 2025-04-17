const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { 
  csrfProtection, 
  validateBooking, 
  processValidationErrors 
} = require('../middleware/security');

// Public users booking form (for a specific course)
router.get('/book/:id', csrfProtection, bookingController.bookingForm);

// Booking handler (public or logged-in) - add validation middleware
// Only apply validation for non-authenticated users
router.post('/book/:id', 
  csrfProtection,
  (req, res, next) => {
    if (!req.session.user) {
      // Only validate for non-authenticated users
      validateBooking(req, res, next);
    } else {
      next();
    }
  },
  processValidationErrors,
  bookingController.bookCourse
);

// My bookings (for logged-in users)
router.get('/my-bookings', ensureAuthenticated, csrfProtection, bookingController.getMyBookings);

// Cancel booking - validate ID parameter
router.post('/booking/:id/cancel', 
  ensureAuthenticated, 
  csrfProtection, 
  bookingController.cancelBooking
);

// Admin: view all bookings
router.get('/admin/bookings', ensureAdmin, csrfProtection, bookingController.getAllBookings);

module.exports = router;