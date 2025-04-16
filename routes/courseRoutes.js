const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/security'); // Add this import

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

// View participants for a course (corrected with csrfProtection)
router.get('/participants/:id', ensureAdmin, csrfProtection, courseController.showParticipants);

// Generate class list report
router.get('/class-list/:id', ensureAdmin, courseController.generateClassList);

router.get('/filter', ensureAdmin, courseController.filterCourses);

module.exports = router;