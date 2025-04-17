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
        error: availabilityResult.isAvailable ? null : 'This course is fully booked.',
        csrfToken: req.csrfToken()
    });
});

// Handle booking (both logged-in and public)
exports.bookCourse = catchAsync(async (req, res, next) => {
    const isAjaxRequest = req.xhr || req.headers.accept.includes('application/json') || req.headers['content-type']?.includes('application/json');
    console.log('Is AJAX request:', isAjaxRequest);
    const courseId = req.params.id;

    // Add these logging statements here
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Is authenticated:', !!req.session.user);
    
    console.log('Attempting to book course:', courseId);

    // Find course - needed for both auth and non-auth paths
    const course = await new Promise((resolve, reject) => {
        courseModel.getCourseById(courseId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    if (!course) {
        if (req.xhr) {
            return res.status(404).json({ error: 'Course not found' });
        }
        return next(new NotFoundError('Course'));
    }

    // Check course availability - needed for both auth and non-auth paths
    const availabilityResult = await new Promise((resolve, reject) => {
        courseModel.checkAvailability(courseId, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });

    if (!availabilityResult.isAvailable) {
        if (req.xhr) {
            return res.status(409).json({ error: 'This course is fully booked' });
        }
        return res.render('book-course', { 
            course,
            error: 'This course is fully booked.',
            spotsLeft: 0,
            csrfToken: req.csrfToken()
        });
    }

    // Separate authenticated and unauthenticated user paths
    let bookingData;
    
    // AUTHENTICATED USER PATH
    if (req.session.user) {
        // For authenticated users (will typically come via AJAX/XHR)
        bookingData = {
            name: req.session.user.name || req.session.user.username,
            email: req.session.user.email || 'N/A',
            courseId,
            username: req.session.user.username
        };
        
        // Check for duplicate booking by username
        const duplicateBooking = await new Promise((resolve, reject) => {
            bookingModel.checkDuplicateBooking({
                courseId,
                username: req.session.user.username
            }, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
        
        if (duplicateBooking) {
            console.log('Duplicate booking detected for user:', req.session.user.username);
            // For AJAX requests (most authenticated bookings)
            return res.status(409).json({ 
                error: 'You have already booked this course',
                isDuplicate: true
            });
        }
    } 
    // UNAUTHENTICATED USER PATH
    else {
        // Validate required fields for unauthenticated users
        if (!req.body.name || !req.body.email) {
            return res.render('book-course', {
                course,
                error: 'Name and email are required',
                spotsLeft: availabilityResult.spotsLeft || 'Unlimited',
                csrfToken: req.csrfToken()
            });
        }
        
        bookingData = {
            name: req.body.name,
            email: req.body.email,
            courseId
        };
        
        // Check for duplicate booking by email for unauthenticated users
        const duplicateBooking = await new Promise((resolve, reject) => {
            bookingModel.checkDuplicateBooking({
                courseId,
                email: req.body.email
            }, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
        
        if (duplicateBooking) {
            console.log('Duplicate booking detected for email:', req.body.email);
            // For form submissions (non-logged in users)
            return res.render('book-course', {
                course,
                error: 'You have already booked this course',
                spotsLeft: availabilityResult.spotsLeft || 'Unlimited',
                csrfToken: req.csrfToken()
            });
        }
    }

    console.log('Booking data prepared:', bookingData);

    // Create booking (common path for both authenticated and unauthenticated users)
    try {
        await new Promise((resolve, reject) => {
            bookingModel.createBooking(bookingData, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        
        if (req.session.user && req.xhr) {
            return res.status(500).json({ error: 'Failed to create booking' });
        }
        
        return res.render('book-course', {
            course,
            error: 'Failed to create booking. Please try again.',
            spotsLeft: availabilityResult.spotsLeft || 'Unlimited',
            csrfToken: req.csrfToken()
        });
    }

    // Success path (separate for authenticated vs unauthenticated)
    if (req.session.user && req.xhr) {
        // For AJAX requests (from logged-in users)
        return res.status(200).json({ 
            message: "Booking successful",
            course: {
                id: course._id,
                title: course.title
            }
        });
    }

    // For form submissions (typically from non-logged in users)
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

    // Get any success message from the session and clear it
    const successMessage = req.session.successMessage;
    delete req.session.successMessage;
    
    res.render('my-bookings', {
        title: 'My Bookings',
        bookings: enrichedBookings,
        successMessage: successMessage,
        csrfToken: req.csrfToken()
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

    // Add a success message to the session
    req.session.successMessage = "Your booking has been successfully cancelled.";

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
        bookings: enrichedBookings,
        csrfToken: req.csrfToken()
    });
});

module.exports = exports;