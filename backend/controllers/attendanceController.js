// Task Owner: Ahmad Sulthon - Attendance (Presensi)
const Attendance = require('../models/Attendance');
const Dashboard = require('../models/Dashboard');

class AttendanceController {
  static async checkIn(req, res) {
    try {
      const { user_id, date, check_in, notes } = req.body;

      // Validation
      if (!user_id || !date || !check_in) {
        return res.status(400).json({
          success: false,
          message: 'User ID, date, and check_in time are required'
        });
      }

      // Create attendance record
      const attendance = await Attendance.create({
        user_id,
        date,
        check_in
      });

      res.status(201).json({
        success: true,
        message: 'Check-in successful',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async checkOut(req, res) {
    try {
      const { user_id, check_out } = req.body;
  
      if (!user_id || !check_out) {
        return res.status(400).json({
          success: false,
          message: 'User ID and check_out are required'
        });
      }
  
      const today = new Date().toISOString().split('T')[0];
  
      const records = await Attendance.findByUserIdAndDate(
        user_id,
        today
      );
  
      if (!records.length) {
        return res.status(404).json({
          success: false,
          message: 'No check-in record found'
        });
      }
  
      const attendanceId = records[0].id;
  
      await Attendance.update(attendanceId, {
        check_out
      });
  
      res.json({
        success: true,
        message: 'Check-out successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async getAttendanceByUser(req, res) {
    try {
      const { user_id } = req.params;
      const { date } = req.query;

      const attendance = await Attendance.findByUserId(user_id, date);

      res.json({
        success: true,
        message: 'Attendance retrieved successfully',
        data: attendance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  static async getAllAttendance(req, res) {
    try {
      const { date, user_id, status, page = 1, limit = 10 } = req.query;
      
      let attendance;
      
      if (date && user_id) {
        attendance = await Attendance.findByUserIdAndDate(user_id, date);
      } else if (date) {
        attendance = await Attendance.findByDate(date);
      } else if (user_id) {
        attendance = await Attendance.findByUserId(user_id);
      } else if (status) {
        attendance = await Attendance.findByStatus(status);
      } else {
        attendance = await Attendance.getAll();
      }

      // Pagination for large datasets  
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedAttendance = attendance.slice(startIndex, endIndex);

      res.json({
        success: true,
        message: 'Attendance retrieved successfully',
        data: {
          attendance: paginatedAttendance,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: attendance.length,
            total_pages: Math.ceil(attendance.length / limit)
          },
          filters: {
            date: date || null,
            user_id: user_id || null,
            status: status || null
          }
        }
      });
    } catch (error) {
      console.error('Get all attendance error:', error);
      
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
        message: 'Failed to retrieve attendance data',
        error: 'An unexpected error occurred while fetching attendance records',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async getAttendanceSummary(req, res) {
    try {
      const { date, period = 'today' } = req.query;
      
      let summaryData;
      
      if (period === 'today') {
        summaryData = await Dashboard.getTodayAttendanceCounts();
      } else if (period === 'week') {
        summaryData = await Dashboard.getWeeklyAttendanceCounts();
      } else if (period === 'month') {
        summaryData = await Dashboard.getMonthlyAttendanceCounts();
      } else if (date) {
        summaryData = await Dashboard.getAttendanceCounts(date);
      } else {
        summaryData = await Dashboard.getAttendanceCounts();
      }

      // Calculate additional metrics
      const totalEmployees = await Dashboard.getEmployeeCounts();
      const attendanceRate = totalEmployees.total_employees > 0 
        ? ((summaryData.present_count / totalEmployees.total_employees) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        message: 'Attendance summary retrieved successfully',
        data: {
          summary: summaryData,
          metrics: {
            total_employees: totalEmployees.total_employees,
            attendance_rate: parseFloat(attendanceRate),
            absent_rate: (100 - parseFloat(attendanceRate)).toFixed(1),
            late_rate: totalEmployees.total_employees > 0 
              ? ((summaryData.late_count / totalEmployees.total_employees) * 100).toFixed(1)
              : 0
          },
          period: period || date || 'all',
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get attendance summary error:', error);
      
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
      
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({
          success: false,
          message: 'Database schema error',
          error: 'Required database tables not found',
          code: 'DATABASE_SCHEMA_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance summary',
        error: 'An unexpected error occurred while generating attendance summary',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async getAttendanceStats(req, res) {
    try {
      const { start_date, end_date, group_by = 'date' } = req.query;
      
      let stats;
      
      if (start_date && end_date) {
        stats = await Dashboard.getAttendanceStatsByDateRange(start_date, end_date, group_by);
      } else if (group_by === 'user') {
        stats = await Dashboard.getAttendanceStatsByUser();
      } else if (group_by === 'department') {
        stats = await Dashboard.getAttendanceStatsByDepartment();
      } else {
        stats = await Dashboard.getMonthlyAttendanceStats();
      }

      res.json({
        success: true,
        message: 'Attendance statistics retrieved successfully',
        data: {
          statistics: stats,
          group_by: group_by,
          date_range: start_date && end_date ? { start_date, end_date } : null,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get attendance stats error:', error);
      
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
        message: 'Failed to retrieve attendance statistics',
        error: 'An unexpected error occurred while fetching attendance statistics',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  static async updateAttendance(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid attendance ID is required',
          field: 'id'
        });
      }

      // Check if attendance exists
      const attendance = await Attendance.findById(parseInt(id));
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
          field: 'id'
        });
      }

      // Update attendance
      const updatedAttendance = await Attendance.update(parseInt(id), updateData);
      if (!updatedAttendance) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update attendance',
          error: 'Update operation failed'
        });
      }

      // Get updated attendance data
      const attendanceData = await Attendance.findById(parseInt(id));

      res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: { attendance: attendanceData }
      });
    } catch (error) {
      console.error('Update attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Attendance update failed',
        error: 'An unexpected error occurred'
      });
    }
  }

  static async deleteAttendance(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid attendance ID is required',
          field: 'id'
        });
      }

      // Check if attendance exists
      const attendance = await Attendance.findById(parseInt(id));
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
          field: 'id'
        });
      }

      // Delete attendance
      const deleteResult = await Attendance.delete(parseInt(id));
      if (!deleteResult) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete attendance',
          error: 'Delete operation failed'
        });
      }

      res.json({
        success: true,
        message: 'Attendance deleted successfully',
        data: { deleted_attendance: { id: attendance.id, user_id: attendance.user_id, date: attendance.date } }
      });
    } catch (error) {
      console.error('Delete attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Attendance deletion failed',
        error: 'An unexpected error occurred'
      });
    }
  }
}

module.exports = AttendanceController;
