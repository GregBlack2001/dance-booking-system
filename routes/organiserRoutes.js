const express = require('express');
const router = express.Router();
const { csrfProtection } = require('../middleware/security');

// Define organiser routes here with CSRF protection
// For example:
// router.get('/dashboard', csrfProtection, organiserController.dashboard);
// router.get('/courses', csrfProtection, organiserController.listCourses);

module.exports = router;