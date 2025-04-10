const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');

// Show booking form for public users
exports.bookingForm = (req, res) => {
  console.log('--- Booking Form Request ---');
  console.log('Course ID:', req.params.id);

  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) {
      console.error('Course Not Found Error:', err);
      return res.status(404).send("Course not found");
    }
    
    // Check if the course is available (has capacity)
    courseModel.checkAvailability(req.params.id, (err, result) => {
      if (err) {
        console.error('Availability Check Error:', err);
        return res.status(500).send("Error checking availability");
      }
      
      console.log('Availability Result:', result);

      if (result.capacity && !result.isAvailable) {
        console.log('Course is fully booked');
        return res.render('book-course', { 
          course,
          error: 'This course is fully booked.',
          spotsLeft: 0
        });
      }
      
      res.render('book-course', { 
        course,
        spotsLeft: result.spotsLeft || 'Unlimited'
      });
    });
  });
};

// Handle booking (both logged-in and public)
exports.bookCourse = (req, res) => {
  console.log('--- Booking Request Start ---');
  console.log('Course ID:', req.params.id);
  console.log('User Session:', req.session.user);
  console.log('Request Body:', req.body);
  console.log('Is XHR Request:', req.xhr);

  const courseId = req.params.id;

  // First check if course exists
  courseModel.getCourseById(courseId, (err, course) => {
    if (err) {
      console.error('Course Lookup Error:', err);
      return res.status(500).send("Error finding course");
    }
    
    if (!course) {
      console.log('Course Not Found:', courseId);
      return res.status(404).send("Course not found");
    }
    
    console.log('Course Found:', course);
    
    // Then check availability if course has capacity
    courseModel.checkAvailability(courseId, (err, result) => {
      if (err) {
        console.error('Availability Check Error:', err);
        return res.status(500).send("Error checking availability");
      }
      
      console.log('Availability Check Result:', result);
      
      if (result.capacity && !result.isAvailable) {
        console.log('Course is fully booked');
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

        console.log('Checking for duplicate booking:', query);

        bookingModel.checkDuplicateBooking(query, (err, existing) => {
          if (err) {
            console.error('Duplicate Booking Check Error:', err);
            return res.status(500).send("Error checking booking");
          }
          
          if (existing) {
            console.log('Duplicate Booking Found');
            return res.status(409).send("You have already booked this course");
          }

          const booking = {
            name: req.session.user.name || req.session.user.username,
            email: req.session.user.email || 'N/A',
            courseId,
            username: req.session.user.username
          };

          console.log('Creating Booking:', booking);

          bookingModel.createBooking(booking, (err) => {
            if (err) {
              console.error('Booking Creation Error:', err);
              return res.status(500).send("Error saving booking");
            }
            
            console.log('Booking Created Successfully');
            return res.status(200).send("Booking successful");
          });
        });

      } else {
        // Public user booking logic
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
  console.log('--- My Bookings Request ---');
  console.log('User Session:', req.session.user);

  if (!req.session.user) {
    console.log('No user session, redirecting to login');
    return res.redirect('/login');
  }
  
  const username = req.session.user.username;
  
  bookingModel.getBookingsByUsername(username, (err, bookings) => {
    if (err) {
      console.error('Bookings Retrieval Error:', err);
      return res.status(500).send("Error retrieving bookings");
    }
    
    console.log('Bookings Found:', bookings.length);
    
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
    })
    .catch(error => {
      console.error('Booking Enrichment Error:', error);
      res.status(500).send("Error processing bookings");
    });
  });
};

// Cancel booking
exports.cancelBooking = (req, res) => {
  console.log('--- Cancel Booking Request ---');
  console.log('User Session:', req.session.user);
  console.log('Booking ID:', req.params.id);

  if (!req.session.user) {
    console.log('No user session, unauthorized');
    return res.status(401).send("You must be logged in to cancel a booking");
  }
  
  const bookingId = req.params.id;
  
  bookingModel.getBookingById(bookingId, (err, booking) => {
    if (err || !booking) {
      console.error('Booking Not Found Error:', err);
      return res.status(404).send("Booking not found");
    }
    
    // Make sure the user owns this booking or is an admin
    if (booking.username !== req.session.user.username && req.session.user.role !== 'admin') {
      console.log('Unauthorized booking cancellation attempt');
      return res.status(403).send("Unauthorized");
    }
    
    bookingModel.deleteBooking(bookingId, (err) => {
      if (err) {
        console.error('Booking Cancellation Error:', err);
        return res.status(500).send("Error canceling booking");
      }
      
      console.log('Booking Cancelled Successfully');
      return res.status(200).send("Booking cancelled");
    });
  });
};

// Admin: View all bookings
exports.getAllBookings = (req, res) => {
  console.log('--- Admin All Bookings Request ---');
  console.log('User Session:', req.session.user);

  if (!req.session.user || req.session.user.role !== 'admin') {
    console.log('Unauthorized access attempt');
    return res.status(403).send("Unauthorized");
  }
  
  bookingModel.getAllBookings((err, bookings) => {
    if (err) {
      console.error('Bookings Retrieval Error:', err);
      return res.status(500).send("Error retrieving bookings");
    }
    
    console.log('Total Bookings Found:', bookings.length);
    
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
    })
    .catch(error => {
      console.error('Booking Enrichment Error:', error);
      res.status(500).send("Error processing bookings");
    });
  });
};