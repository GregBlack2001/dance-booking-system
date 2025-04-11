const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAdmin } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin, 
  processValidationErrors 
} = require('../middleware/security');
const { csrfProtection } = require('../middleware/security');

// Register routes
router.get('/register', csrfProtection, authController.showRegister);
router.post(
  '/register', 
  csrfProtection,
  validateRegistration, 
  processValidationErrors, 
  authController.register
);

// Login routes
router.get('/login', csrfProtection, authController.showLogin);
router.post(
  '/login', 
  csrfProtection,
  validateLogin, 
  processValidationErrors, 
  authController.login
);

// Logout route
router.get('/logout', csrfProtection, authController.logout);

// Admin user management routes
router.get('/admin/users', 
  csrfProtection,
  ensureAdmin, 
  authController.showUsers
);

router.post(
  '/admin/users/:username/role', 
  csrfProtection,
  ensureAdmin, 
  // Optional: Add validation for role update if needed
  authController.updateUserRole
);

router.post(
  '/admin/users/:username/delete', 
  csrfProtection,
  ensureAdmin, 
  authController.deleteUser
);

module.exports = router;