// Task Owner: Team FULLSTOK - Initial Setup & General Config
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const verifyRoutes = require('./verify');
const userRoutes = require('./users');
const attendanceRoutes = require('./attendance');
const leaveRoutes = require('./leave');
const announcementRoutes = require('./announcements');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is healthy' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/verify', verifyRoutes);
router.use('/users', userRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/announcements', announcementRoutes);

module.exports = router;
