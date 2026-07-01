// Task Owner: Ariq Jamhari - Leave Requests (Cuti)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const LeaveController = require('../controllers/leaveController');

// Get leave statistics (protected route) - must be first
router.get('/statistics', auth, authorize(['admin', 'user']), LeaveController.getLeaveStatistics);

// Create leave request (protected route)
router.post('/', auth, authorize(['admin', 'user']), LeaveController.createRequest);

// Get leave requests by user (protected route)
router.get('/user/:user_id', auth, authorize(['admin', 'user']), LeaveController.getRequestsByUser);

// Get all leave requests (protected route)
router.get('/', auth, authorize(['admin', 'user']), LeaveController.getAllRequests);

// Get leave request by ID (protected route)
router.get('/:id', auth, authorize(['admin', 'user']), LeaveController.getRequestById);

// Approve leave request (admin only)
router.post('/:id/approve', auth, authorize(['admin']), LeaveController.approveRequest);

// Reject leave request (admin only)
router.post('/:id/reject', auth, authorize(['admin']), LeaveController.rejectRequest);

// Delete leave request (admin only)
router.delete('/:id', auth, authorize(['admin']), LeaveController.deleteRequest);

module.exports = router;
