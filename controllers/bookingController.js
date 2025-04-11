const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');
const { 
    AppError, 
    ValidationError, 
    NotFoundError, 
    catchAsync 
} = require('../middleware/errorHandler');

// Show booking form for public users
exports.bookingForm = catchAsync(async (req, res, next) => {
    const courseId = req.params.id;

    // Find course
    const course = await new Promise((resolve, reject) => {
        courseModel.getCourseById(courseId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    if (!course) {
        return next(new NotFoundError('Course'));
    }

    // Check course availability
    const availabilityResult = await new Promise((resolve, reject) => {
        courseModel.checkAvailability(courseId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    // Render booking form with course details
    res.render('book-course', { 
        course,
        spotsLeft: availabilityResult.spotsLeft || 'Unlimited',
        error: availabilityResult.isAvailable ? null : 'This course is fully booked.'
    });
});

// Handle booking (both logged-in and public)
exports.bookCourse = catchAsync(async (req, res, next) => {
    const courseId = req.params.id;

    // Find course
    const course = await new Promise((resolve, reject) => {
        courseModel.getCourseById(courseId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    if (!course) {
        return next(new NotFoundError('Course'));
    }

    // Check course availability
    const availabilityResult = await new Promise((resolve, reject) => {
        courseModel.checkAvailability(courseId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    if (!availabilityResult.isAvailable) {
        // Course is fully booked
        if (req.xhr) {
            return res.status(409).json({ error: 'This course is fully booked' });
        }
        return res.render('book-course', { 
            course,
            error: 'This course is fully booked.',
            spotsLeft: 0
        });
    }

    // Prepare booking data
    const bookingData = req.session.user 
        ? {
            name: req.session.user.name || req.session.user.username,
            email: req.session.user.email || 'N/A',
            courseId,
            username: req.session.user.username
        }
        : {
            name: req.body.name,
            email: req.body.email,
            courseId
        };

    // Validate input for public bookings
    if (!req.session.user) {
        if (!bookingData.name || !bookingData.email) {
            if (req.xhr) {
                return res.status(400).json({ error: 'Name and email are required' });
            }
            return res.render('book-course', {
                course,
                error: 'Name and email are required.',
                spotsLeft: availabilityResult.spotsLeft || 'Unlimited'
            });
        }
    }

    // Check for duplicate booking
    const duplicateBooking = await new Promise((resolve, reject) => {
        const query = req.session.user 
            ? { courseId, username: req.session.user.username }
            : { courseId, email: bookingData.email };
        
        bookingModel.checkDuplicateBooking(query, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    // Handle duplicate booking
    if (duplicateBooking) {
        if (req.xhr) {
            // For AJAX requests
            return res.status(409).json({ 
                error: 'You have already booked this course' 
            });
        }
        
        // For form submissions
        return res.render('book-course', {
            course,
            error: 'You have already booked this course',
            spotsLeft: availabilityResult.spotsLeft || 'Unlimited'
        });
    }

    // Create booking
    try {
        await new Promise((resolve, reject) => {
            bookingModel.createBooking(bookingData, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    } catch (error) {
        // Handle booking creation error
        if (req.xhr) {
            return res.status(500).json({ error: 'Failed to create booking' });
        }
        return res.render('book-course', {
            course,
            error: 'Failed to create booking. Please try again.',
            spotsLeft: availabilityResult.spotsLeft || 'Unlimited'
        });
    }

    // Successful booking response
    if (req.xhr) {
        return res.status(200).json({ message: "Booking successful" });
    }

    res.render('booking-success', { 
        name: bookingData.name, 
        course 
    });
});

// Get my bookings
exports.getMyBookings = catchAsync(async (req, res, next) => {
    // Ensure user is logged in
    if (!req.session.user) {
        return next(new AppError('You must be logged in to view bookings', 401));
    }

    const username = req.session.user.username;

    // Get user's bookings
    const bookings = await new Promise((resolve, reject) => {
        bookingModel.getBookingsByUsername(username, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });

    // Enrich bookings with course details
    const enrichedBookings = await Promise.all(bookings.map(booking => {
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
    }));

    res.render('my-bookings', {
        title: 'My Bookings',
        bookings: enrichedBookings
    });
});

// Cancel booking
exports.cancelBooking = catchAsync(async (req, res, next) => {
    // Ensure user is logged in
    if (!req.session.user) {
        return next(new AppError('You must be logged in to cancel a booking', 401));
    }

    const bookingId = req.params.id;

    // Find the booking
    const booking = await new Promise((resolve, reject) => {
        bookingModel.getBookingById(bookingId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    // Validate booking exists
    if (!booking) {
        return next(new NotFoundError('Booking'));
    }

    // Ensure user owns the booking or is an admin
    if (booking.username !== req.session.user.username && req.session.user.role !== 'admin') {
        return next(new AppError('You are not authorized to cancel this booking', 403));
    }

    // Delete the booking
    await new Promise((resolve, reject) => {
        bookingModel.deleteBooking(bookingId, (err) => {
            if (err) reject(err);
            resolve();
        });
    });

    // Send response
    if (req.xhr) {
        return res.status(200).json({ message: "Booking cancelled" });
    }

    res.redirect('/my-bookings');
});

// Admin: View all bookings
exports.getAllBookings = catchAsync(async (req, res, next) => {
    // Ensure user is an admin
    if (!req.session.user || req.session.user.role !== 'admin') {
        return next(new AppError('Unauthorized access', 403));
    }

    // Get all bookings
    const bookings = await new Promise((resolve, reject) => {
        bookingModel.getAllBookings((err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });

    // Enrich bookings with course details
    const enrichedBookings = await Promise.all(bookings.map(booking => {
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
    }));

    res.render('admin-bookings', {
        title: 'All Bookings',
        bookings: enrichedBookings
    });
});

module.exports = exports;