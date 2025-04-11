const express = require('express');
const router = express.Router();
const courseModel = require('../models/courseModel');

// Homepage - includes user/admin context
router.get('/', (req, res) => {
  res.render('home', {
    title: 'Welcome to DanceMove Academy',
    user: req.session.user,
    isAdmin: req.session.user?.role === 'admin'
  });
});

// Public classes page - all users can view & book
router.get('/classes', (req, res) => {
  courseModel.getAllCourses((err, courses) => {
    if (err) {
      console.error('Error loading courses:', err);
      return res.status(500).send("Could not load class info");
    }

    // Debug log all courses
    console.log('All courses from database:', JSON.stringify(courses, null, 2));

    res.render('classes', {
      title: 'Current Classes',
      courses: courses,
      user: req.session.user,
      isAdmin: req.session.user?.role === 'admin',
      csrfToken: req.csrfToken()
    });
  });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us',
    user: req.session.user,
    isAdmin: req.session.user?.role === 'admin'
  });
});

module.exports = router;