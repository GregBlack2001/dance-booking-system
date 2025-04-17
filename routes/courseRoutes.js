const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { 
  csrfProtection, 
  validateCourse, 
  processValidationErrors 
} = require('../middleware/security');

// Courses for authenticated users
router.get('/', ensureAuthenticated, csrfProtection, courseController.showCourses);

// Admin-only course management
router.get('/add', ensureAdmin, csrfProtection, courseController.addCourseForm);

// Add course - add validation
router.post('/add', 
  ensureAdmin, 
  csrfProtection, 
  validateCourse,  // Add course validation
  processValidationErrors,  // Add error handling
  courseController.addCourse
);

router.get('/edit/:id', ensureAdmin, csrfProtection, courseController.editCourseForm);

// Edit course - add validation
router.post('/edit/:id', 
  ensureAdmin, 
  csrfProtection, 
  validateCourse,  // Add course validation
  processValidationErrors,  // Add error handling
  courseController.editCourse
);

// Delete course
router.post('/delete/:id', 
  ensureAdmin, 
  csrfProtection, 
  courseController.deleteCourse
);

// Admin dashboard
router.get('/admin', ensureAdmin, csrfProtection, courseController.adminDashboard);

// Course search
router.get('/search', csrfProtection, courseController.searchCourses);

// View participants for a course
router.get('/participants/:id', ensureAdmin, csrfProtection, courseController.showParticipants);

// Generate class list report
router.get('/class-list/:id', ensureAdmin, csrfProtection, courseController.generateClassList);

// Filter courses
router.get('/filter', ensureAdmin, csrfProtection, courseController.filterCourses);

module.exports = router;