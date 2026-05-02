// Task Owner: Ahmad Sulthon - Attendance (Presensi)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const AttendanceController = require('../controllers/attendanceController');

// Check-in (protected route)
router.post('/checkin', auth, authorize(['admin', 'user']), AttendanceController.checkIn);

// Check-out (protected route)
router.post('/checkout', auth, authorize(['admin', 'user']), AttendanceController.checkOut);

// Get attendance by user (protected route)
router.get('/user/:user_id', auth, authorize(['admin', 'user']), AttendanceController.getAttendanceByUser);

// Get all attendance (protected route)
router.get('/', auth, authorize(['admin', 'user']), AttendanceController.getAllAttendance);

// Get attendance summary for dashboard cards (protected route)
router.get('/summary', auth, authorize(['admin', 'user']), AttendanceController.getAttendanceSummary);

// Get attendance statistics (protected route)
router.get('/stats', auth, authorize(['admin', 'user']), AttendanceController.getAttendanceStats);

module.exports = router;
