const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');

// Show booking form for public users
exports.bookingForm = (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    res.render('book-course', { course });
  });
};

// Handle booking (both logged-in and public)
exports.bookCourse = (req, res) => {
  const courseId = req.params.id;

  // Logged-in user
  if (req.session.user) {
    const query = {
      courseId,
      username: req.session.user.username
    };

    bookingModel.checkDuplicateBooking(query, (err, existing) => {
      if (err) return res.status(500).send("Error checking booking");
      if (existing) return res.status(409).send("You have already booked this course");

      const booking = {
        name: req.session.user.username,
        email: 'N/A',
        courseId,
        username: req.session.user.username
      };

      bookingModel.createBooking(booking, (err) => {
        if (err) return res.status(500).send("Error saving booking");
        return res.status(200).send("Booking successful");
      });
    });

  } else {
    // Public user booking
    const { name, email } = req.body;
    const query = { courseId, email };

    bookingModel.checkDuplicateBooking(query, (err, existing) => {
      if (err) return res.status(500).send("Error checking booking");
      if (existing) {
        courseModel.getCourseById(courseId, (err, course) => {
          return res.render('book-course', {
            course,
            error: 'You’ve already booked this class with that email.'
          });
        });
      } else {
        const booking = { name, email, courseId };

        bookingModel.createBooking(booking, (err) => {
          if (err) return res.status(500).send("Error saving booking");
          res.render('booking-success', { name });
        });
      }
    });
  }
};


