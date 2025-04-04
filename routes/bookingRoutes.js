const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const bookingModel = require('../models/bookingModel'); // ✅ IMPORT THIS
const auth = require('../middleware/auth'); // optional if you want to protect route

// Public users booking form (for a specific course)
router.get('/book/:id', bookingController.bookingForm);

// Booking handler (public or logged-in)
router.post('/book/:id', bookingController.bookCourse);

const courseModel = require('../models/courseModel'); // ✅ Add this if not already imported

router.get('/my-bookings', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;

  bookingModel.getBookingsByUsername(username, async (err, bookings) => {
    if (err) return res.status(500).send("Could not load your bookings");

    // Enrich each booking with course info
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        return new Promise((resolve) => {
          courseModel.getCourseById(booking.courseId, (err, course) => {
            booking.course = course || { title: 'Unknown', date: 'N/A', location: 'N/A' };
            resolve(booking);
          });
        });
      })
    );

    res.render('my-bookings', {
      title: 'My Bookings',
      bookings: enrichedBookings
    });
  });
});


module.exports = router; // ✅ Make sure this is at the end!

  