const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');

// Show booking form for public users
exports.bookingForm = (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    
    // Check if the course is available (has capacity)
    courseModel.checkAvailability(req.params.id, (err, result) => {
      if (err) return res.status(500).send("Error checking availability");
      
      if (result.capacity && !result.isAvailable) {
        return res.render('book-course', { 
          course,
          error: 'This course is fully booked.',
          spotsLeft: 0
        });
      }
      
      res.render('book-course', { 
        course,
        spotsLeft: result.spotsLeft
      });
    });
  });
};

// Handle booking (both logged-in and public)
exports.bookCourse = (req, res) => {
  const courseId = req.params.id;

  // First check if course exists
  courseModel.getCourseById(courseId, (err, course) => {
    if (err || !course) {
      if (req.xhr) return res.status(404).send("Course not found");
      return res.status(404).send("Course not found");
    }
    
    // Then check availability if course has capacity
    courseModel.checkAvailability(courseId, (err, result) => {
      if (err) {
        if (req.xhr) return res.status(500).send("Error checking availability");
        return res.status(500).send("Error checking availability");
      }
      
      if (result.capacity && !result.isAvailable) {
        if (req.xhr) {
          return res.status(409).send("This course is fully booked");
        } else {
          return res.render('book-course', { 
            course: result.course,
            error: 'This course is fully booked.',
            spotsLeft: 0
          });
        }
      }
      
      // Proceed with booking
      // Logged-in user
      if (req.session.user) {
        const query = {
          courseId,
          username: req.session.user.username
        };

        bookingModel.checkDuplicateBooking(query, (err, existing) => {
          if (err) {
            if (req.xhr) return res.status(500).send("Error checking booking");
            return res.status(500).send("Error checking booking");
          }
          
          if (existing) {
            if (req.xhr) return res.status(409).send("You have already booked this course");
            return res.status(409).send("You have already booked this course");
          }

          const booking = {
            name: req.session.user.name || req.session.user.username,
            email: req.session.user.email || 'N/A',
            courseId,
            username: req.session.user.username
          };

          bookingModel.createBooking(booking, (err) => {
            if (err) {
              if (req.xhr) return res.status(500).send("Error saving booking");
              return res.status(500).send("Error saving booking");
            }
            
            if (req.xhr) return res.status(200).send("Booking successful");
            return res.redirect('/my-bookings');
          });
        });

      } else {
        // Public user booking
        const { name, email } = req.body;
        
        if (!name || !email) {
          return res.render('book-course', {
            course: result.course,
            error: 'Name and email are required.'
          });
        }
        
        const query = { courseId, email };

        bookingModel.checkDuplicateBooking(query, (err, existing) => {
          if (err) return res.status(500).send("Error checking booking");
          
          if (existing) {
            return res.render('book-course', {
              course: result.course,
              error: 'You\'ve already booked this class with that email.'
            });
          } else {
            const booking = { 
              name, 
              email, 
              courseId
            };

            bookingModel.createBooking(booking, (err) => {
              if (err) return res.status(500).send("Error saving booking");
              res.render('booking-success', { name, course: result.course });
            });
          }
        });
      }
    });
  });
};

// Get my bookings
exports.getMyBookings = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  const username = req.session.user.username;
  
  bookingModel.getBookingsByUsername(username, (err, bookings) => {
    if (err) return res.status(500).send("Error retrieving bookings");
    
    // Enrich bookings with course details
    Promise.all(bookings.map(booking => {
      return new Promise((resolve) => {
        courseModel.getCourseById(booking.courseId, (err, course) => {
          if (course) {
            booking.course = course;
          } else {
            booking.course = { title: 'Unknown Course', date: 'N/A' };
          }
          resolve(booking);
        });
      });
    }))
    .then(enrichedBookings => {
      res.render('my-bookings', {
        title: 'My Bookings',
        bookings: enrichedBookings
      });
    });
  });
};

// Cancel booking
exports.cancelBooking = (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("You must be logged in to cancel a booking");
  }
  
  const bookingId = req.params.id;
  
  bookingModel.getBookingById(bookingId, (err, booking) => {
    if (err || !booking) {
      if (req.xhr) return res.status(404).send("Booking not found");
      return res.status(404).send("Booking not found");
    }
    
    // Make sure the user owns this booking or is an admin
    if (booking.username !== req.session.user.username && req.session.user.role !== 'admin') {
      if (req.xhr) return res.status(403).send("Unauthorized");
      return res.status(403).send("Unauthorized");
    }
    
    bookingModel.deleteBooking(bookingId, (err) => {
      if (err) {
        if (req.xhr) return res.status(500).send("Error canceling booking");
        return res.status(500).send("Error canceling booking");
      }
      
      if (req.xhr) return res.status(200).send("Booking cancelled");
      return res.redirect('/my-bookings');
    });
  });
};

// Admin: View all bookings
exports.getAllBookings = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send("Unauthorized");
  }
  
  bookingModel.getAllBookings((err, bookings) => {
    if (err) return res.status(500).send("Error retrieving bookings");
    
    // Enrich bookings with course details
    Promise.all(bookings.map(booking => {
      return new Promise((resolve) => {
        courseModel.getCourseById(booking.courseId, (err, course) => {
          if (course) {
            booking.course = course;
          } else {
            booking.course = { title: 'Unknown Course', date: 'N/A' };
          }
          resolve(booking);
        });
      });
    }))
    .then(enrichedBookings => {
      res.render('admin-bookings', {
        title: 'All Bookings',
        bookings: enrichedBookings
      });
    });
  });
};