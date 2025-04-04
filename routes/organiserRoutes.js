const express = require('express');
const router = express.Router();
const courseModel = require('../models/courseModel');
const bookingModel = require('../models/bookingModel');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// View participants per course
router.get('/participants/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");

    bookingModel.getBookingsByCourse(req.params.id, (err, bookings) => {
      if (err) return res.status(500).send("Error loading bookings");
      res.render('participant-list', { course, bookings });
    });
  });
});

// Generate class list report
router.get('/reports/class-list/:id', ensureAuthenticated, ensureAdmin, (req, res) => {
  courseModel.getCourseById(req.params.id, (err, course) => {
    if (err || !course) return res.status(404).send("Course not found");

    bookingModel.getBookingsByCourse(req.params.id, (err, bookings) => {
      if (err) return res.status(500).send("Error loading bookings");
      
      res.render('class-list-report', { 
        course, 
        bookings,
        title: `Class List: ${course.title}`,
        generateDate: new Date().toLocaleDateString()
      });
    });
  });
});

module.exports = router;