const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAdmin } = require('../middleware/auth');

// Register routes
router.get('/register', authController.showRegister);
router.post('/register', authController.register);

// Login routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Logout route
router.get('/logout', authController.logout);

// Admin user management routes
router.get('/admin/users', ensureAdmin, authController.showUsers);
router.post('/admin/users/:username/role', ensureAdmin, authController.updateUserRole);
router.post('/admin/users/:username/delete', ensureAdmin, authController.deleteUser);

module.exports = router;