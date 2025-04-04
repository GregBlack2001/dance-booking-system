const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Courses for authenticated users
router.get('/', ensureAuthenticated, courseController.showCourses);

// Admin-only course management
router.get('/add', ensureAdmin, courseController.addCourseForm);
router.post('/add', ensureAdmin, courseController.addCourse);
router.get('/edit/:id', ensureAdmin, courseController.editCourseForm);
router.post('/edit/:id', ensureAdmin, courseController.editCourse);
router.post('/delete/:id', ensureAdmin, courseController.deleteCourse);

// Admin dashboard
router.get('/admin', ensureAdmin, courseController.adminDashboard);

// Course search
router.get('/search', courseController.searchCourses);

// View participants for a course
router.get('/participants/:id', ensureAdmin, courseController.showParticipants);

module.exports = router;