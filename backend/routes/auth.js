// Task Owner: Gilang Ramadan - Authentication & Security
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register
router.post('/register', AuthController.register);

// Login
router.post('/login', AuthController.login);

// Get current user profile
router.get('/profile', auth, AuthController.getProfile);

module.exports = router;
