const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');
const userModel = require('../models/userModel');

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
  res.render('course-form'); // Changed to use our combined template
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
    capacity: req.body.capacity ? parseInt(req.body.capacity) : null,
    duration: req.body.duration || '1 hour',
    createdAt: new Date()
  };
  
  courseModel.createCourse(course, (err) => {
    if (err) return res.status(500).send("Error adding course");
    res.redirect('/courses/admin');
  });
};

// Show edit form
exports.editCourseForm = (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    res.render('course-form', { course }); // Changed to use our combined template
  });
};

// Handle edit course
exports.editCourse = (req, res) => {
  const updated = {
    title: req.body.title,
    instructor: req.body.instructor,
    date: req.body.date,
    description: req.body.description,
    location: req.body.location || 'Main Studio',
    price: parseFloat(req.body.price) || 0,
    capacity: req.body.capacity ? parseInt(req.body.capacity) : null,
    duration: req.body.duration || '1 hour',
    updatedAt: new Date()
  };
  
  courseModel.updateCourse(req.params.id, updated, (err) => {
    if (err) return res.status(500).send("Error updating course");
    res.redirect('/courses/admin');
  });
};

// Handle delete course
exports.deleteCourse = (req, res) => {
  courseModel.deleteCourse(req.params.id, (err) => {
    if (err) return res.status(500).send("Error deleting course");
    res.redirect('/courses/admin');
  });
};

// Show admin dashboard (enhanced to include stats)
exports.adminDashboard = (req, res) => {
  // Get all courses
  courseModel.getAllCourses((err, courses) => {
    if (err) return res.status(500).send('Failed to load courses');
    
    // Get count of all bookings
    bookingModel.getAllBookings((err, bookings) => {
      const totalBookings = err ? 0 : bookings.length;
      
      // Calculate recent bookings (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentBookings = bookings ? bookings.filter(b => 
        new Date(b.bookingDate) >= oneWeekAgo
      ).length : 0;
      
      // Get count of all users
      userModel.getAllUsers((err, users) => {
        const totalUsers = err ? 0 : users.length;
        
        // Calculate recent users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = 0; // Would need registration date in user model
        
        // Calculate recent courses (last 30 days)
        const recentCourses = courses ? courses.filter(c => 
          c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo
        ).length : 0;
        
        // Get unique instructors and locations for filters
        const instructors = [...new Set(courses.map(c => c.instructor))];
        const locations = [...new Set(courses.map(c => c.location).filter(Boolean))];
        
        // Render the enhanced dashboard with all data
        res.render('admin-dashboard', {
          title: 'Admin Dashboard',
          courses,
          totalBookings,
          recentBookings,
          totalUsers,
          recentUsers: recentUsers || 'N/A',
          recentCourses,
          instructors,
          locations
        });
      });
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

// Generate class list report
exports.generateClassList = (req, res) => {
  const courseId = req.params.id;
  
  courseModel.getCourseById(courseId, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");
    
    bookingModel.getBookingsByCourse(courseId, (err, bookings) => {
      if (err) return res.status(500).send("Error retrieving bookings");
      
      res.render('class-list-report', {
        course,
        bookings,
        title: `Class List: ${course.title}`,
        generateDate: new Date().toLocaleDateString()
      });
    });
  });
};

// Filter courses by criteria
exports.filterCourses = (req, res) => {
  const { instructor, location, sortBy } = req.query;
  
  // Get all courses first
  courseModel.getAllCourses((err, allCourses) => {
    if (err) return res.status(500).send("Error retrieving courses");
    
    // Apply filters
    let filteredCourses = [...allCourses];
    
    if (instructor && instructor !== 'All Instructors') {
      filteredCourses = filteredCourses.filter(c => c.instructor === instructor);
    }
    
    if (location && location !== 'All Locations') {
      filteredCourses = filteredCourses.filter(c => c.location === location);
    }
    
    // Apply sorting
    if (sortBy) {
      switch(sortBy) {
        case 'Date (Newest)':
          filteredCourses.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'Date (Oldest)':
          filteredCourses.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'Title (A-Z)':
          filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
          break;
        // Add more sorting options as needed
      }
    }
    
    // Return JSON if it's an AJAX request
    if (req.xhr) {
      return res.json(filteredCourses);
    }
    
    // Otherwise render the page
    res.render('admin-dashboard', {
      title: 'Admin Dashboard - Filtered Courses',
      courses: filteredCourses,
      // Include all the other data your template needs
      instructor,
      location,
      sortBy
    });
  });
};
