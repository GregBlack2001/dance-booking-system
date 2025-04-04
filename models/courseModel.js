const { coursesDB } = require('./db');

// Create a course
exports.createCourse = (course, callback) => {
  // Ensure all required fields are present
  const newCourse = {
    title: course.title,
    instructor: course.instructor,
    date: course.date,
    description: course.description,
    location: course.location || 'Main Studio',
    price: course.price || 0,
    capacity: course.capacity || null, // null means unlimited
    duration: course.duration || '1 hour',
    createdAt: new Date()
  };
  
  coursesDB.insert(newCourse, callback);
};

// Retrieve all courses
exports.getAllCourses = (callback) => {
  coursesDB.find({}).sort({ date: 1 }).exec(callback);
};

// Retrieve a single course by ID
exports.getCourseById = (id, callback) => {
  coursesDB.findOne({ _id: id }, callback);
};

// Update a course by ID
exports.updateCourse = (id, course, callback) => {
  coursesDB.update({ _id: id }, { $set: course }, {}, callback);
};

// Delete a course by ID
exports.deleteCourse = (id, callback) => {
  coursesDB.remove({ _id: id }, {}, callback);
};

// Get upcoming courses (today and future)
exports.getUpcomingCourses = (callback) => {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  coursesDB.find({ date: { $gte: today } }).sort({ date: 1 }).exec(callback);
};

// Get courses by instructor
exports.getCoursesByInstructor = (instructor, callback) => {
  coursesDB.find({ instructor }).sort({ date: 1 }).exec(callback);
};

// Check if a course has available capacity
exports.checkAvailability = (courseId, callback) => {
  // First get the course to check its capacity
  this.getCourseById(courseId, (err, course) => {
    if (err || !course) return callback(err || new Error('Course not found'));
    
    // If course has no defined capacity, it's available
    if (!course.capacity) return callback(null, { isAvailable: true, course });
    
    // Count the number of bookings for this course
    const bookingModel = require('./bookingModel');
    bookingModel.getBookingsByCourse(courseId, (err, bookings) => {
      if (err) return callback(err);
      
      const isAvailable = bookings.length < course.capacity;
      const spotsLeft = course.capacity - bookings.length;
      
      callback(null, { 
        isAvailable, 
        course, 
        bookedCount: bookings.length,
        spotsLeft
      });
    });
  });
};

// Search courses by keyword (title or description)
exports.searchCourses = (keyword, callback) => {
  const regex = new RegExp(keyword, 'i');
  coursesDB.find({ 
    $or: [
      { title: regex },
      { description: regex },
      { instructor: regex },
      { location: regex }
    ]
  }).sort({ date: 1 }).exec(callback);
};

// Export the database for direct access if needed
exports.coursesDB = coursesDB;