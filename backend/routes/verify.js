// Task Owner: Gilang Ramadan - Authentication & Security
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Simple verification endpoint
router.get('/', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
