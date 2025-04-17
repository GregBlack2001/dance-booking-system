const express = require('express');
const router = express.Router();
const courseModel = require('../models/courseModel');
const { csrfProtection } = require('../middleware/security');

// Homepage - includes user/admin context
router.get('/', csrfProtection, (req, res) => {
  res.render('home', {
    title: 'Welcome to DanceMove Academy',
    user: req.session.user,
    isAdmin: req.session.user?.role === 'admin',
    csrfToken: req.csrfToken()
  });
});

// Public classes page - all users can view & book
router.get('/classes', csrfProtection, (req, res) => {
  courseModel.getAllCourses((err, courses) => {
    if (err) {
      console.error('Error loading courses:', err);
      return res.status(500).send("Could not load class info");
    }

    // Extract unique instructors and locations for filters
    const instructors = [...new Set(courses.map(course => course.instructor))];
    const locations = [...new Set(courses.map(course => course.location).filter(Boolean))];

    res.render('classes', {
      title: 'Current Classes',
      courses: courses,
      instructors: instructors,
      locations: locations,
      user: req.session.user,
      isAdmin: req.session.user?.role === 'admin',
      csrfToken: req.csrfToken()
    });
  });
});

// About page
router.get('/about', csrfProtection, (req, res) => {
  res.render('about', {
    title: 'About Us',
    user: req.session.user,
    isAdmin: req.session.user?.role === 'admin',
    csrfToken: req.csrfToken()
  });
});

module.exports = router;