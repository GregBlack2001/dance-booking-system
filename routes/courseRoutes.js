const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const courseModel = require('../models/courseModel');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Public for authenticated users
router.get('/', ensureAuthenticated, courseController.showCourses);

// Admin-only course management
router.get('/add', ensureAuthenticated, ensureAdmin, courseController.addCourseForm);
router.post('/add', ensureAuthenticated, ensureAdmin, courseController.addCourse);
router.get('/edit/:id', ensureAuthenticated, ensureAdmin, courseController.editCourseForm);
router.post('/edit/:id', ensureAuthenticated, ensureAdmin, courseController.editCourse);
router.post('/delete/:id', ensureAuthenticated, ensureAdmin, courseController.deleteCourse);

// Admin dashboard
router.get('/admin', ensureAuthenticated, ensureAdmin, (req, res) => {
  courseModel.getAllCourses((err, courses) => {
    if (err) return res.status(500).send('Failed to load courses');
    res.render('admin-dashboard', {
      title: 'Admin Dashboard',
      courses
    });
  });
});

module.exports = router;




