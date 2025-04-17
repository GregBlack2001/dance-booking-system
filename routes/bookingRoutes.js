const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { 
  csrfProtection, 
  processValidationErrors 
} = require('../middleware/security');

// Public users booking form (for a specific course)
router.get('/book/:id', csrfProtection, bookingController.bookingForm);

// Booking handler (public or logged-in)
router.post('/book/:id', 
  csrfProtection,
  processValidationErrors,
  bookingController.bookCourse
);

// My bookings (for logged-in users)
router.get('/my-bookings', ensureAuthenticated, csrfProtection, bookingController.getMyBookings);

// Cancel booking
router.post('/booking/:id/cancel', 
  ensureAuthenticated, 
  csrfProtection, 
  bookingController.cancelBooking
);

// Admin: view all bookings
router.get('/admin/bookings', ensureAdmin, csrfProtection, bookingController.getAllBookings);

module.exports = router;