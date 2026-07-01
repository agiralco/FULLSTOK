// Task Owner: Ahmad Sulthon - Attendances (Presensi)
const db = require('../config/database');

class Attendances {
  static async create(attendanceData) {
    const { user_id, date, check_in, check_out } = attendanceData;
  
    const [result] = await db.query(
      `INSERT INTO attendances
      (user_id, date, check_in_time, check_out_time)
      VALUES (?, ?, ?, ?)`,
      [user_id, date, check_in, check_out || null]
    );
  
    return {
      id: result.insertId,
      user_id,
      date,
      check_in,
      check_out
    };
  } 

  static async findByUserId(userId, date = null) {
    let query = 'SELECT * FROM attendances WHERE user_id = ?';
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
      FROM attendances a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.date DESC, a.check_in_time ASC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT a.*, u.name, u.email, u.position 
      FROM attendances a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async update(id, attendancesData) {
    const { check_in, check_out, status, notes, approved_by } = attendancesData;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (check_in !== undefined) {
      updateFields.push('check_in_time = ?');
      updateValues.push(check_in);
    }
    if (check_out !== undefined) {
      updateFields.push('check_out_time = ?');
      updateValues.push(check_out);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }
    if (approved_by !== undefined) {
      updateFields.push('approved_by = ?');
      updateValues.push(approved_by);
    }
    
    if (updateFields.length === 0) {
      return false; // No fields to update
    }
    
    const [result] = await db.query(
      `UPDATE attendances SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM attendances WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findByUserIdAndDate(userId, date) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendances a JOIN users u ON a.user_id = u.id WHERE a.user_id = ? AND a.date = ? ORDER BY a.check_in_time ASC',
      [userId, date]
    );
    return rows;
  }

  static async findByDate(date) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendances a JOIN users u ON a.user_id = u.id WHERE a.date = ? ORDER BY a.check_in_time ASC',
      [date]
    );
    return rows;
  }

  static async findByStatus(status) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendances a JOIN users u ON a.user_id = u.id WHERE a.status = ? ORDER BY a.date DESC, a.check_in_time ASC',
      [status]
    );
    return rows;
  }

  static async getAttendancesByDateRange(startDate, endDate) {
    const [rows] = await db.query(
      'SELECT a.*, u.name, u.email, u.position FROM attendances a JOIN users u ON a.user_id = u.id WHERE a.date BETWEEN ? AND ? ORDER BY a.date DESC, a.check_in_time ASC',
      [startDate, endDate]
    );
    return rows;
  }

  static async getAttendancesStatsByUser(userId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as total_days, COUNT(CASE WHEN status = "present" THEN 1 END) as present_days, COUNT(CASE WHEN status = "absent" THEN 1 END) as absent_days, COUNT(CASE WHEN status = "late" THEN 1 END) as late_days FROM attendances WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  static async getAttendancesStatsByDepartment() {
    const [rows] = await db.query(
      'SELECT u.department, COUNT(*) as total_days, COUNT(CASE WHEN a.status = "present" THEN 1 END) as present_days, COUNT(CASE WHEN a.status = "absent" THEN 1 END) as absent_days, COUNT(CASE WHEN a.status = "late" THEN 1 END) as late_days FROM attendances a JOIN users u ON a.user_id = u.id GROUP BY u.department ORDER BY u.department'
    );
    return rows;
  }
}

module.exports = Attendances;
