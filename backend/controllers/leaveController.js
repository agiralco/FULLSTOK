// Task Owner: Ariq Jamhari - Leave Requests (Cuti)
const LeaveRequest = require('../models/LeaveRequest');

class LeaveController {
  static async createRequest(req, res) {
    try {
      console.log("BODY:", req.body);

      const { user_id, leave_type, start_date, end_date, reason } = req.body;

      // Validation
      if (!user_id || !leave_type || !start_date || !end_date || !reason) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Calculate total days
      const start = new Date(start_date);
      const end = new Date(end_date);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (totalDays <= 0) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }

      // Create leave request
      const leaveRequest = await LeaveRequest.create({
        user_id,
        leave_type,
        start_date,
        end_date,
        total_days: totalDays,
        reason
      });

      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully',
        data: { leave_request: leaveRequest }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async getRequestsByUser(req, res) {
    try {
      const { user_id } = req.params;
      const requests = await LeaveRequest.findByUserId(user_id);

      res.json({
        success: true,
        message: 'Leave requests retrieved successfully',
        data: requests
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async getAllRequests(req, res) {
    try {
      const { status, leave_type, user_id, page = 1, limit = 10 } = req.query;
      
      let requests;
      
      if (status) {
        requests = await LeaveRequest.getByStatus(status);
      } else if (leave_type) {
        requests = await LeaveRequest.getByType(leave_type);
      } else if (user_id) {
        requests = await LeaveRequest.findByUserId(user_id);
      } else {
        requests = await LeaveRequest.getAll();
      }

      // Pagination for large datasets
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedRequests = requests.slice(startIndex, endIndex);

      res.json({
        success: true,
        message: 'Leave requests retrieved successfully',
        data: {
          requests: paginatedRequests,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: requests.length,
            total_pages: Math.ceil(requests.length / limit)
          },
          filters: {
            status: status || null,
            leave_type: leave_type || null,
            user_id: user_id || null
          }
        }
      });
    } catch (error) {
      console.error('Get all leave requests error:', error);
      
      // Handle specific database errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database connection failed',
          error: 'Unable to connect to database. Please try again later.',
          code: 'DATABASE_UNAVAILABLE'
        });
      }
      
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
          success: false,
          message: 'Database access error',
          error: 'Database permission denied',
          code: 'DATABASE_ACCESS_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave requests',
        error: 'An unexpected error occurred while fetching leave requests',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async getRequestById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid leave request ID is required',
          field: 'id'
        });
      }

      const request = await LeaveRequest.findById(parseInt(id));
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found',
          field: 'id'
        });
      }

      res.json({
        success: true,
        message: 'Leave request retrieved successfully',
        data: { request }
      });
    } catch (error) {
      console.error('Get leave request by ID error:', error);
      
      // Handle specific database errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database connection failed',
          error: 'Unable to connect to database. Please try again later.',
          code: 'DATABASE_UNAVAILABLE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave request',
        error: 'An unexpected error occurred while fetching leave request',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async getLeaveStatistics(req, res) {
    try {
      const { period = 'all' } = req.query;
      
      let stats;
      
      if (period === 'today') {
        stats = await LeaveRequest.getTodayStats();
      } else if (period === 'week') {
        stats = await LeaveRequest.getWeeklyStats();
      } else if (period === 'month') {
        stats = await LeaveRequest.getMonthlyStats();
      } else {
        stats = await LeaveRequest.getLeaveStatistics();
      }

      res.json({
        success: true,
        message: 'Leave statistics retrieved successfully',
        data: {
          statistics: stats,
          period: period,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get leave statistics error:', error);
      
      // Handle specific database errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database connection failed',
          error: 'Unable to connect to database. Please try again later.',
          code: 'DATABASE_UNAVAILABLE'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leave statistics',
        error: 'An unexpected error occurred while fetching leave statistics',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async approveRequest(req, res) {
    try {
      const { id } = req.params;
      const { approved_by, approval_notes } = req.body;

      // Enhanced validation
      if (!approved_by) {
        return res.status(400).json({
          success: false,
          message: 'Approver ID is required',
          field: 'approved_by'
        });
      }

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid leave request ID is required',
          field: 'id'
        });
      }

      // Verify leave request exists and is in pending status
      let leaveRequest;
      try {
        leaveRequest = await LeaveRequest.findById(parseInt(id));
        if (!leaveRequest) {
          return res.status(404).json({
            success: false,
            message: 'Leave request not found',
            field: 'id'
          });
        }
      } catch (dbError) {
        console.error('Database error during leave request lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during approval process',
          error: 'Failed to verify leave request',
          code: 'DATABASE_ERROR'
        });
      }

      // Validate current status
      if (leaveRequest.status.toLowerCase() !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot approve leave request with status: ${leaveRequest.status}`,
          field: 'status',
          current_status: leaveRequest.status
        });
      }

      // Prevent self-approval
      if (parseInt(approved_by) === parseInt(leaveRequest.user_id)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot approve your own leave request',
          field: 'approved_by'
        });
      }

      // Approve the request
      let updated;
      try {
        updated = await LeaveRequest.approve(parseInt(id), parseInt(approved_by));
        if (!updated) {
          return res.status(500).json({
            success: false,
            message: 'Failed to approve leave request',
            error: 'Update operation failed',
            code: 'UPDATE_FAILED'
          });
        }
      } catch (updateError) {
        console.error('Leave request approval error:', updateError);
        
        // Handle specific database errors
        if (updateError.code === 'ECONNREFUSED' || updateError.code === 'ENOTFOUND') {
          return res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: 'Unable to connect to database. Please try again later.',
            code: 'DATABASE_UNAVAILABLE'
          });
        }
        
        if (updateError.code === 'ER_ACCESS_DENIED_ERROR') {
          return res.status(500).json({
            success: false,
            message: 'Database access error',
            error: 'Database permission denied',
            code: 'DATABASE_ACCESS_ERROR'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to approve leave request',
          error: 'An unexpected error occurred during approval',
          code: 'INTERNAL_SERVER_ERROR'
        });
      }

      // Get updated leave request for response
      const updatedRequest = await LeaveRequest.findById(parseInt(id));

      res.json({
        success: true,
        message: 'Leave request approved successfully',
        data: {
          leave_request: updatedRequest,
          approved_by: parseInt(approved_by),
          approved_at: updatedRequest.approved_at,
          previous_status: leaveRequest.status
        }
      });
    } catch (error) {
      console.error('Approve leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Leave request approval failed',
        error: 'An unexpected error occurred during approval process',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async rejectRequest(req, res) {
    try {
      const { id } = req.params;
      const { approved_by, rejection_reason } = req.body;

      // Enhanced validation
      if (!approved_by) {
        return res.status(400).json({
          success: false,
          message: 'Approver ID is required',
          field: 'approved_by'
        });
      }

      if (!rejection_reason || typeof rejection_reason !== 'string' || rejection_reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required and cannot be empty',
          field: 'rejection_reason'
        });
      }

      if (rejection_reason.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason must be 500 characters or less',
          field: 'rejection_reason'
        });
      }

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid leave request ID is required',
          field: 'id'
        });
      }

      // Verify leave request exists and is in pending status
      let leaveRequest;
      try {
        leaveRequest = await LeaveRequest.findById(parseInt(id));
        if (!leaveRequest) {
          return res.status(404).json({
            success: false,
            message: 'Leave request not found',
            field: 'id'
          });
        }
      } catch (dbError) {
        console.error('Database error during leave request lookup:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error during rejection process',
          error: 'Failed to verify leave request',
          code: 'DATABASE_ERROR'
        });
      }

      // Validate current status
      if (leaveRequest.status.toLowerCase() !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot reject leave request with status: ${leaveRequest.status}`,
          field: 'status',
          current_status: leaveRequest.status
        });
      }

      // Prevent self-rejection
      if (parseInt(approved_by) === parseInt(leaveRequest.user_id)) {
        return res.status(403).json({
          success: false,
          message: 'Cannot reject your own leave request',
          field: 'approved_by'
        });
      }

      // Reject the request
      let updated;
      try {
        updated = await LeaveRequest.reject(parseInt(id), parseInt(approved_by), rejection_reason.trim());
        if (!updated) {
          return res.status(500).json({
            success: false,
            message: 'Failed to reject leave request',
            error: 'Update operation failed',
            code: 'UPDATE_FAILED'
          });
        }
      } catch (updateError) {
        console.error('Leave request rejection error:', updateError);
        
        // Handle specific database errors
        if (updateError.code === 'ECONNREFUSED' || updateError.code === 'ENOTFOUND') {
          return res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: 'Unable to connect to database. Please try again later.',
            code: 'DATABASE_UNAVAILABLE'
          });
        }
        
        if (updateError.code === 'ER_ACCESS_DENIED_ERROR') {
          return res.status(500).json({
            success: false,
            message: 'Database access error',
            error: 'Database permission denied',
            code: 'DATABASE_ACCESS_ERROR'
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to reject leave request',
          error: 'An unexpected error occurred during rejection',
          code: 'INTERNAL_SERVER_ERROR'
        });
      }

      // Get updated leave request for response
      const updatedRequest = await LeaveRequest.findById(parseInt(id));

      res.json({
        success: true,
        message: 'Leave request rejected successfully',
        data: {
          leave_request: updatedRequest,
          approved_by: parseInt(approved_by),
          rejected_at: updatedRequest.approved_at,
          rejection_reason: updatedRequest.rejection_reason,
          previous_status: leaveRequest.status
        }
      });
    } catch (error) {
      console.error('Reject leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Leave request rejection failed',
        error: 'An unexpected error occurred during rejection process',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async deleteRequest(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid leave request ID is required',
          field: 'id'
        });
      }

      // Check if leave request exists
      const leaveRequest = await LeaveRequest.findById(parseInt(id));
      if (!leaveRequest) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found',
          field: 'id'
        });
      }

      // Delete leave request
      const deleteResult = await LeaveRequest.delete(parseInt(id));
      if (!deleteResult) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete leave request',
          error: 'Delete operation failed'
        });
      }

      res.json({
        success: true,
        message: 'Leave request deleted successfully',
        data: { deleted_leave_request: { id: leaveRequest.id, user_id: leaveRequest.user_id, leave_type: leaveRequest.leave_type } }
      });
    } catch (error) {
      console.error('Delete leave request error:', error);
      res.status(500).json({
        success: false,
        message: 'Leave request deletion failed',
        error: 'An unexpected error occurred'
      });
    }
  }
}

module.exports = LeaveController;
