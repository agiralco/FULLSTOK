// Task Owner: Ahmad Sulthon - Attendance (Presensi)
const db = require('../config/database');

class Attendance {
  static async create(attendanceData) {
    const { user_id, date, check_in, check_out, status, notes, approved_by } = attendanceData;
    const [result] = await db.query(
      'INSERT INTO attendance (user_id, date, check_in_time, check_out_time, status, notes, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, date, check_in, check_out, status, notes, approved_by]
    );
    return { id: result.insertId, ...attendanceData };
  }

  static async findByUserId(userId, date = null) {
    let query = 'SELECT * FROM attendance WHERE user_id = ?';
    let params = [userId];
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY date DESC';
    
    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT a.*, u.name, u.email, u.position 
      FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.date DESC, a.check_in_time ASC
    `);
    return rows;
  }

  static async update(id, attendanceData) {
    const { check_in, check_out, status, notes, approved_by } = attendanceData;
    const [result] = await db.query(
      'UPDATE attendance SET check_in_time = ?, check_out_time = ?, status = ?, notes = ?, approved_by = ? WHERE id = ?',
      [check_in, check_out, status, notes, approved_by, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM attendance WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findByUserIdAndDate(userId, date) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = ? AND a.date = ? ORDER BY a.check_in_time ASC',
      [userId, date]
    );
    return rows;
  }

  static async findByDate(date) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.date = ? ORDER BY a.check_in_time ASC',
      [date]
    );
    return rows;
  }

  static async findByStatus(status) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.status = ? ORDER BY a.date DESC, a.check_in_time ASC',
      [status]
    );
    return rows;
  }

  static async getAttendanceByDateRange(startDate, endDate) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.date BETWEEN ? AND ? ORDER BY a.date DESC, a.check_in_time ASC',
      [startDate, endDate]
    );
    return rows;
  }

  static async getAttendanceStatsByUser(userId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as total_days, COUNT(CASE WHEN status = "present" THEN 1 END) as present_days, COUNT(CASE WHEN status = "absent" THEN 1 END) as absent_days, COUNT(CASE WHEN status = "late" THEN 1 END) as late_days FROM attendance WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  static async getAttendanceStatsByDepartment() {
    const [rows] = await db.query(
      'SELECT u.department, COUNT(*) as total_days, COUNT(CASE WHEN a.status = "present" THEN 1 END) as present_days, COUNT(CASE WHEN a.status = "absent" THEN 1 END) as absent_days, COUNT(CASE WHEN a.status = "late" THEN 1 END) as late_days FROM attendance a JOIN users u ON a.user_id = u.id GROUP BY u.department ORDER BY u.department'
    );
    return rows;
  }
}

module.exports = Attendance;
