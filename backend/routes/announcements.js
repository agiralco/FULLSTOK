// Task Owner: Ahmad Ghazy Hibatullah - Announcements (Pengumuman)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const AnnouncementController = require('../controllers/announcementController');

// Create announcement (admin only)
router.post('/', auth, authorize(['admin']), AnnouncementController.createAnnouncement);

// Get all announcements (protected route)
router.get('/', auth, authorize(['admin', 'user']), AnnouncementController.getAllAnnouncements);

// Get announcement by ID (protected route)
router.get('/:id', auth, authorize(['admin', 'user']), AnnouncementController.getAnnouncementById);

// Update announcement (admin only)
router.put('/:id', auth, authorize(['admin']), AnnouncementController.updateAnnouncement);

// Delete announcement (admin only)
router.delete('/:id', auth, authorize(['admin']), AnnouncementController.deleteAnnouncement);

// Soft delete announcement (admin only)
router.patch('/:id/soft-delete', auth, authorize(['admin']), AnnouncementController.softDeleteAnnouncement);

module.exports = router;
