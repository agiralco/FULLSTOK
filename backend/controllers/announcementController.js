// Task Owner: Ahmad Ghazy Hibatullah - Announcements (Pengumuman)
const Announcement = require('../models/Announcement');

class AnnouncementController {
  static async createAnnouncement(req, res) {
    try {
      const { title, content, created_by, category = 'general', priority = 'medium', expiry_date } = req.body;

      // Enhanced validation
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title is required and cannot be empty',
          field: 'title'
        });
      }

      if (title.trim().length < 3 || title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title must be between 3 and 200 characters',
          field: 'title'
        });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Content is required and cannot be empty',
          field: 'content'
        });
      }

      if (content.trim().length < 10 || content.trim().length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Content must be between 10 and 5000 characters',
          field: 'content'
        });
      }

      if (!created_by || isNaN(created_by)) {
        return res.status(400).json({
          success: false,
          message: 'Valid created_by user ID is required',
          field: 'created_by'
        });
      }

      // Validate category
      const validCategories = ['general', 'policy', 'event', 'urgent'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Must be one of: general, policy, event, urgent',
          field: 'category'
        });
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority. Must be one of: low, medium, high',
          field: 'priority'
        });
      }

      // Validate expiry date if provided
      if (expiry_date) {
        const expiryDateObj = new Date(expiry_date);
        if (isNaN(expiryDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid expiry date format',
            field: 'expiry_date'
          });
        }
        if (expiryDateObj <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Expiry date must be in the future',
            field: 'expiry_date'
          });
        }
      }

      // Create announcement with enhanced error handling
      let announcement;
      try {
        announcement = await Announcement.create({
          title: title.trim(),
          content: content.trim(),
          created_by: parseInt(created_by),
          category,
          priority,
          expiry_date: expiry_date || null
        });

        if (!announcement) {
          return res.status(500).json({
            success: false,
            message: 'Failed to create announcement',
            error: 'Create operation returned null',
            code: 'CREATE_FAILED'
          });
        }
      } catch (createError) {
        console.error('Announcement creation error:', createError);
        
        // Handle specific database errors
        if (createError.code === 'ECONNREFUSED' || createError.code === 'ENOTFOUND') {
          return res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: 'Unable to connect to database. Please try again later.',
            code: 'DATABASE_UNAVAILABLE'
          });
        }
        
        if (createError.code === 'ER_ACCESS_DENIED_ERROR') {
          return res.status(500).json({
            success: false,
            message: 'Database access error',
            error: 'Database permission denied',
            code: 'DATABASE_ACCESS_ERROR'
          });
        }
        
        if (createError.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({
            success: false,
            message: 'Database schema error',
            error: 'Announcements table not found',
            code: 'DATABASE_SCHEMA_ERROR'
          });
        }
        
        if (createError.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: 'Duplicate announcement entry',
            error: 'An announcement with this title already exists',
            code: 'DUPLICATE_ENTRY'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to create announcement',
          error: 'An unexpected error occurred during announcement creation',
          code: 'INTERNAL_SERVER_ERROR'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: {
          announcement,
          created_at: announcement.created_at,
          expiry_date: announcement.expiry_date
        }
      });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Announcement creation failed',
        error: 'An unexpected error occurred during announcement creation process',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async getAllAnnouncements(req, res) {
    try {
      const announcements = await Announcement.getAll();

      res.json({
        success: true,
        message: 'Announcements retrieved successfully',
        data: announcements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findById(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      // Update view count
      await Announcement.updateViewCount(id);

      res.json({
        success: true,
        message: 'Announcement retrieved successfully',
        data: announcement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { title, content, category, priority, is_active, expiry_date } = req.body;

      // Validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      const updated = await Announcement.update(id, {
        title,
        content,
        category,
        priority,
        is_active,
        expiry_date
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found'
        });
      }

      res.json({
        success: true,
        message: 'Announcement updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      // Enhanced validation
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid announcement ID is required',
          field: 'id'
        });
      }

      // Verify announcement exists before deletion
      let announcement;
      try {
        announcement = await Announcement.findById(parseInt(id));
        if (!announcement) {
          return res.status(404).json({
            success: false,
            message: 'Announcement not found',
            field: 'id'
          });
        }
      } catch (dbError) {
        console.error('Database error during announcement lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during deletion process',
          error: 'Failed to verify announcement',
          code: 'DATABASE_ERROR'
        });
      }

      // Delete announcement with enhanced error handling
      let deleted;
      try {
        deleted = await Announcement.delete(parseInt(id));
        if (!deleted) {
          return res.status(500).json({
            success: false,
            message: 'Failed to delete announcement',
            error: 'Delete operation returned false',
            code: 'DELETE_FAILED'
          });
        }
      } catch (deleteError) {
        console.error('Announcement deletion error:', deleteError);
        
        // Handle specific database errors
        if (deleteError.code === 'ECONNREFUSED' || deleteError.code === 'ENOTFOUND') {
          return res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: 'Unable to connect to database. Please try again later.',
            code: 'DATABASE_UNAVAILABLE'
          });
        }
        
        if (deleteError.code === 'ER_ACCESS_DENIED_ERROR') {
          return res.status(500).json({
            success: false,
            message: 'Database access error',
            error: 'Database permission denied',
            code: 'DATABASE_ACCESS_ERROR'
          });
        }
        
        if (deleteError.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({
            success: false,
            message: 'Database schema error',
            error: 'Announcements table not found',
            code: 'DATABASE_SCHEMA_ERROR'
          });
        }
        
        if (deleteError.code === 'ER_ROW_IS_REFERENCED' || deleteError.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(409).json({
            success: false,
            message: 'Cannot delete announcement',
            error: 'Announcement is referenced by other records',
            code: 'REFERENCED_RECORDS'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to delete announcement',
          error: 'An unexpected error occurred during announcement deletion',
          code: 'INTERNAL_SERVER_ERROR'
        });
      }

      res.json({
        success: true,
        message: 'Announcement deleted successfully',
        data: {
          deleted_announcement: {
            id: announcement.id,
            title: announcement.title,
            category: announcement.category,
            priority: announcement.priority
          },
          deleted_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Announcement deletion failed',
        error: 'An unexpected error occurred during announcement deletion process',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async softDeleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      // Enhanced validation
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid announcement ID is required',
          field: 'id'
        });
      }

      // Verify announcement exists before soft deletion
      let announcement;
      try {
        announcement = await Announcement.findById(parseInt(id));
        if (!announcement) {
          return res.status(404).json({
            success: false,
            message: 'Announcement not found',
            field: 'id'
          });
        }
      } catch (dbError) {
        console.error('Database error during announcement lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during soft deletion process',
          error: 'Failed to verify announcement',
          code: 'DATABASE_ERROR'
        });
      }

      // Soft delete announcement with enhanced error handling
      let softDeleted;
      try {
        softDeleted = await Announcement.softDelete(parseInt(id));
        if (!softDeleted) {
          return res.status(500).json({
            success: false,
            message: 'Failed to soft delete announcement',
            error: 'Soft delete operation returned false',
            code: 'SOFT_DELETE_FAILED'
          });
        }
      } catch (deleteError) {
        console.error('Announcement soft deletion error:', deleteError);
        
        // Handle specific database errors
        if (deleteError.code === 'ECONNREFUSED' || deleteError.code === 'ENOTFOUND') {
          return res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: 'Unable to connect to database. Please try again later.',
            code: 'DATABASE_UNAVAILABLE'
          });
        }
        
        if (deleteError.code === 'ER_ACCESS_DENIED_ERROR') {
          return res.status(500).json({
            success: false,
            message: 'Database access error',
            error: 'Database permission denied',
            code: 'DATABASE_ACCESS_ERROR'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to soft delete announcement',
          error: 'An unexpected error occurred during announcement soft deletion',
          code: 'INTERNAL_SERVER_ERROR'
        });
      }

      res.json({
        success: true,
        message: 'Announcement soft deleted successfully',
        data: {
          soft_deleted_announcement: {
            id: announcement.id,
            title: announcement.title,
            category: announcement.category,
            previous_status: announcement.is_active ? 'active' : 'inactive'
          },
          soft_deleted_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Soft delete announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'Announcement soft deletion failed',
        error: 'An unexpected error occurred during announcement soft deletion process',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = AnnouncementController;
