// Task Owner: Ariq Jamhari - Leave Requests (Cuti)
const db = require('../config/database');

class LeaveRequest {
  static async create(leaveData) {
    const { user_id, leave_type, start_date, end_date, total_days, reason } = leaveData;
    const [result] = await db.query(
      'INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, leave_type, start_date, end_date, total_days, reason]
    );
    return { id: result.insertId, ...leaveData };
  }

  static async findByUserId(userId) {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email 
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE lr.user_id = ? 
      ORDER BY lr.id DESC
    `, [userId]);
    return rows;
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position, u.department
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      ORDER BY lr.id DESC
    `);
    return rows;
  }

  static async getByStatus(status) {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position, u.department
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE lr.status = ?
      ORDER BY lr.id DESC
    `, [status]);
    return rows;
  }

  static async getByType(leaveType) {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position, u.department
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE lr.leave_type = ?
      ORDER BY lr.id DESC
    `, [leaveType]);
    return rows;
  }

  static async getPending() {
    return await this.getByStatus('pending');
  }

  static async getApproved() {
    return await this.getByStatus('approved');
  }

  static async getRejected() {
    return await this.getByStatus('rejected');
  }

  static async getOngoing() {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position, u.department
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE lr.status = 'approved' 
        AND lr.start_date <= CURDATE() 
        AND lr.end_date >= CURDATE()
      ORDER BY lr.start_date ASC
    `);
    return rows;
  }

  static async getUpcoming() {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position, u.department
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE lr.status = 'approved' 
        AND lr.start_date > CURDATE()
      ORDER BY lr.start_date ASC
      LIMIT 10
    `);
    return rows;
  }

  static async search(searchTerm) {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position, u.department
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE u.name LIKE ? OR u.email LIKE ? OR lr.reason LIKE ? OR lr.leave_type LIKE ?
      ORDER BY lr.id DESC
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT lr.*, u.name as user_name, u.email as user_email, u.position 
      FROM leave_requests lr 
      JOIN users u ON lr.user_id = u.id 
      WHERE lr.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async updateStatus(id, status, approved_by, rejection_reason = null) {
    const [result] = await db.query(
      'UPDATE leave_requests SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?',
      [status, approved_by, rejection_reason, id]
    );
    return result.affectedRows > 0;
  }

  static async approve(id, approved_by) {
    return await this.updateStatus(id, 'approved', approved_by);
  }

  static async reject(id, approved_by, rejection_reason) {
    return await this.updateStatus(id, 'rejected', approved_by, rejection_reason);
  }

  static async getLeaveStatistics() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN leave_type = 'sick' THEN 1 END) as sick_count,
        COUNT(CASE WHEN leave_type = 'vacation' THEN 1 END) as vacation_count,
        COUNT(CASE WHEN leave_type = 'personal' THEN 1 END) as personal_count,
        COUNT(CASE WHEN leave_type = 'maternity' THEN 1 END) as maternity_count,
        COUNT(CASE WHEN leave_type = 'paternity' THEN 1 END) as paternity_count,
        SUM(total_days) as total_days_taken,
        COUNT(CASE WHEN status = 'approved' THEN total_days END) as approved_days
      FROM leave_requests
    `);
    return rows[0];
  }

  static async getMonthlyStats(year = null, month = null) {
    let query = `
      SELECT 
        DATE_FORMAT(start_date, '%Y-%m') as month,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        SUM(total_days) as total_days,
        COUNT(CASE WHEN status = 'approved' THEN total_days END) as approved_days
      FROM leave_requests
    `;
    
    let params = [];
    
    if (year && month) {
      query += ' WHERE YEAR(start_date) = ? AND MONTH(start_date) = ?';
      params.push(year, month);
    } else if (year) {
      query += ' WHERE YEAR(start_date) = ?';
      params.push(year);
    }
    
    query += ' GROUP BY DATE_FORMAT(start_date, "%Y-%m") ORDER BY month DESC LIMIT 12';
    
    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getTodayStats() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        SUM(total_days) as total_days,
        COUNT(CASE WHEN status = 'approved' THEN total_days END) as approved_days
      FROM leave_requests 
      WHERE DATE(created_at) = CURDATE()
    `);
    return rows[0];
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM leave_requests WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getWeeklyStats() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        SUM(total_days) as total_days,
        COUNT(CASE WHEN status = 'approved' THEN total_days END) as approved_days
      FROM leave_requests 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND created_at <= CURDATE()
    `);
    return rows[0];
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM leave_requests WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = LeaveRequest;
