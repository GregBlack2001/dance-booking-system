const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Public users booking form (for a specific course)
router.get('/book/:id', bookingController.bookingForm);

// Booking handler (public or logged-in)
router.post('/book/:id', bookingController.bookCourse);

// My bookings (for logged-in users)
router.get('/my-bookings', ensureAuthenticated, bookingController.getMyBookings);

// Cancel booking
router.post('/booking/:id/cancel', ensureAuthenticated, bookingController.cancelBooking);

// Admin: view all bookings
router.get('/admin/bookings', ensureAdmin, bookingController.getAllBookings);

module.exports = router;