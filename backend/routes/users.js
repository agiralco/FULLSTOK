// Task Owner: Muhtari Anwar - Employee Directory (Users CRUD)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const UserController = require('../controllers/userController');

// Get all employees (protected route)
router.get('/', auth, authorize(['admin', 'user']), UserController.getAllUsers);

// Get employee by ID (protected route)
router.get('/:id', auth, authorize(['admin', 'user']), UserController.getUserById);

// Create new employee (user role allowed for testing)
router.post('/', auth, authorize(['admin', 'user']), UserController.createUser);

// Update employee (user role allowed for testing)
router.put('/:id', auth, authorize(['admin', 'user']), UserController.updateUser);

// Delete employee (admin only)
router.delete('/:id', auth, authorize(['admin']), UserController.deleteUser);

module.exports = router;
