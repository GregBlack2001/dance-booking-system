const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');

// Show all courses
exports.showCourses = (req, res) => {
  courseModel.getAllCourses((err, courses) => {
    if (err) return res.status(500).send("Error retrieving courses");
    res.render('courses', {
      courses,
      isAdmin: req.session.user && req.session.user.role === 'admin'
    });
  });
};

// Show add course form
exports.addCourseForm = (req, res) => {
  res.render('add-course');
};

// Handle add course
exports.addCourse = (req, res) => {
  const course = {
    title: req.body.title,
    instructor: req.body.instructor,
    date: req.body.date,
    description: req.body.description,
    location: req.body.location || 'Main Studio',
    price: parseFloat(req.body.price) || 10.00,
    capacity: parseInt(req.body.capacity) || null,
    duration: req.body.duration || '1 hour'
  };
  
  courseModel.createCourse(course, (err) => {
    if (err) return res.status(500).send("Error adding course");
    res.redirect('/courses');
  });
};

// Show edit form
exports.editCourseForm = (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    res.render('edit-course', { course });
  });
};

// Handle edit course
exports.editCourse = (req, res) => {
  const updated = {
    title: req.body.title,
    instructor: req.body.instructor,
    date: req.body.date,
    description: req.body.description,
    location: req.body.location,
    price: parseFloat(req.body.price) || 0,
    capacity: parseInt(req.body.capacity) || null,
    duration: req.body.duration
  };
  
  courseModel.updateCourse(req.params.id, updated, (err) => {
    if (err) return res.status(500).send("Error updating course");
    res.redirect('/courses');
  });
};

// Handle delete course
exports.deleteCourse = (req, res) => {
  courseModel.deleteCourse(req.params.id, (err) => {
    if (err) return res.status(500).send("Error deleting course");
    res.redirect('/courses');
  });
};

// Show admin dashboard
exports.adminDashboard = (req, res) => {
  courseModel.getAllCourses((err, courses) => {
    if (err) return res.status(500).send('Failed to load courses');
    
    res.render('admin-dashboard', {
      title: 'Admin Dashboard',
      courses
    });
  });
};

// Search courses
exports.searchCourses = (req, res) => {
  const keyword = req.query.keyword;
  
  if (!keyword) {
    return res.redirect('/classes');
  }
  
  courseModel.searchCourses(keyword, (err, courses) => {
    if (err) return res.status(500).send("Error searching courses");
    
    res.render('classes', {
      title: `Search Results for "${keyword}"`,
      courses,
      user: req.session.user,
      isAdmin: req.session.user?.role === 'admin',
      searchQuery: keyword
    });
  });
};

// Show participants for a specific course
exports.showParticipants = (req, res) => {
  const courseId = req.params.id;
  
  courseModel.getCourseById(courseId, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    
    bookingModel.getBookingsByCourse(courseId, (err, bookings) => {
      if (err) return res.status(500).send("Error retrieving bookings");
      
      res.render('participant-list', {
        course,
        bookings
      });
    });
  });
};