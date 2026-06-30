// Task Owner: Team FULLSTOK - Initial Setup & General Config
const db = require('../config/database');

class Dashboard {
  static async getEmployeeCounts() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_employees,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_employees,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
      FROM users
    `);
    return rows[0];
  }

  static async getAttendanceCounts(date = null) {
    let query = `
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'permission' THEN 1 END) as permission_count,
        COUNT(CASE WHEN check_in_time IS NOT NULL THEN 1 END) as checked_in_count,
        COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as checked_out_count
      FROM attendance
    `;
    
    let params = [];
    
    if (date) {
      query += ' WHERE date = ?';
      params.push(date);
    }
    
    const [rows] = await db.query(query, params);
    return rows[0];
  }

  static async getTodayAttendanceCounts() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return await this.getAttendanceCounts(today);
  }

  static async getLeaveRequestCounts() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN leave_type = 'sick' THEN 1 END) as sick_leave_count,
        COUNT(CASE WHEN leave_type = 'vacation' THEN 1 END) as vacation_leave_count,
        COUNT(CASE WHEN leave_type = 'personal' THEN 1 END) as personal_leave_count,
        COUNT(CASE WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 1 END) as ongoing_leave_count
      FROM leave_requests
    `);
    return rows[0];
  }

  static async getAnnouncementCounts() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_announcements,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_announcements,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_announcements,
        COUNT(CASE WHEN category = 'urgent' THEN 1 END) as urgent_count,
        COUNT(CASE WHEN category = 'general' THEN 1 END) as general_count,
        COUNT(CASE WHEN category = 'policy' THEN 1 END) as policy_count,
        COUNT(CASE WHEN category = 'event' THEN 1 END) as event_count,
        COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date >= CURDATE() THEN 1 END) as not_expired_count,
        COUNT(CASE WHEN expiry_date IS NULL OR expiry_date < CURDATE() THEN 1 END) as expired_count
      FROM announcements
    `);
    return rows[0];
  }

  static async getDepartmentStats() {
    const [rows] = await db.query(`
      SELECT 
        department,
        COUNT(*) as employee_count,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_count,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
      FROM users 
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY employee_count DESC
    `);
    return rows;
  }

  static async getMonthlyAttendanceStats(year = null, month = null) {
    let query = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'permission' THEN 1 END) as permission_days,
        COUNT(DISTINCT user_id) as unique_employees
      FROM attendance
    `;
    
    let params = [];
    
    if (year && month) {
      query += ' WHERE YEAR(date) = ? AND MONTH(date) = ?';
      params.push(year, month);
    } else if (year) {
      query += ' WHERE YEAR(date) = ?';
      params.push(year);
    }
    
    query += ' GROUP BY DATE_FORMAT(date, "%Y-%m") ORDER BY month DESC LIMIT 12';
    
    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getTopPerformers(limit = 5) {
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.position,
        u.department,
        COUNT(a.id) as total_attendance,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(a.id)) * 100, 
          2
        ) as attendance_percentage
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id
      WHERE u.is_active = 1
      GROUP BY u.id, u.name, u.email, u.position, u.department
      HAVING total_attendance > 0
      ORDER BY attendance_percentage DESC, present_days DESC
      LIMIT ?
    `, [limit]);
    
    return rows;
  }

  static async getDashboardSummary() {
    try {
      const [
        employeeCounts,
        todayAttendance,
        leaveRequests,
        announcements,
        departmentStats,
        topPerformers
      ] = await Promise.all([
        this.getEmployeeCounts(),
        this.getTodayAttendanceCounts(),
        this.getLeaveRequestCounts(),
        this.getAnnouncementCounts(),
        this.getDepartmentStats(),
        this.getTopPerformers(3)
      ]);

      return {
        employees: employeeCounts,
        attendance: todayAttendance,
        leaveRequests: leaveRequests,
        announcements: announcements,
        departmentStats: departmentStats,
        topPerformers: topPerformers,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Dashboard summary failed: ${error.message}`);
    }
  }

  static async getWeeklyAttendanceCounts() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'permission' THEN 1 END) as permission_count
      FROM attendance 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND date <= CURDATE()
    `);
    return rows[0];
  }

  static async getMonthlyAttendanceCounts() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'permission' THEN 1 END) as permission_count
      FROM attendance 
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND date <= CURDATE()
    `);
    return rows[0];
  }

  static async getAttendanceStatsByDateRange(startDate, endDate, groupBy = 'date') {
    let query;
    let params = [];

    if (groupBy === 'date') {
      query = `
        SELECT 
          date,
          COUNT(*) as total_attendance,
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
          COUNT(CASE WHEN status = 'permission' THEN 1 END) as permission_count
        FROM attendance 
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date
      `;
      params = [startDate, endDate];
    } else if (groupBy === 'user') {
      query = `
        SELECT 
          u.name as user_name,
          u.email,
          COUNT(*) as total_attendance,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
          COUNT(CASE WHEN a.status = 'permission' THEN 1 END) as permission_count
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date BETWEEN ? AND ?
        GROUP BY u.id, u.name, u.email
        ORDER BY present_count DESC
      `;
      params = [startDate, endDate];
    } else if (groupBy === 'department') {
      query = `
        SELECT 
          u.department,
          COUNT(*) as total_attendance,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
          COUNT(CASE WHEN a.status = 'permission' THEN 1 END) as permission_count
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date BETWEEN ? AND ?
        GROUP BY u.department
        ORDER BY present_count DESC
      `;
      params = [startDate, endDate];
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getAttendanceStatsByUser() {
    const [rows] = await db.query(`
      SELECT 
        u.name as user_name,
        u.email,
        u.position,
        u.department,
        COUNT(*) as total_attendance,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(*)) * 100, 2) as attendance_percentage
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.position, u.department
      ORDER BY attendance_percentage DESC
    `);
    return rows;
  }

  static async getAttendanceStatsByDepartment() {
    const [rows] = await db.query(`
      SELECT 
        u.department,
        COUNT(*) as total_attendance,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(DISTINCT a.user_id) as unique_employees,
        ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(*)) * 100, 2) as attendance_percentage
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      GROUP BY u.department
      ORDER BY attendance_percentage DESC
    `);
    return rows;
  }
}

module.exports = Dashboard;
