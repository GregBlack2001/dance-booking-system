const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register routes
router.get('/register', authController.showRegister);
router.post('/register', authController.register);

// Login routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Logout route
router.get('/logout', authController.logout);

module.exports = router;



