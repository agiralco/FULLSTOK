// Task Owner: Muhtari Anwar - Employee Directory (Users CRUD)
const db = require('../config/database');

class User {
  static async create(userData) {
    const { name, email, password, role = 'user', position, department, phone, address, hire_date, salary } = userData;
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, position, department, phone, address, hire_date, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, role, position, department, phone, address, hire_date, salary]
    );
    return { id: result.insertId, ...userData };
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT id, name, email, password, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users ORDER BY id DESC'
    );
    return rows;
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getAdminCount() {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1',
      ['admin']
    );
    return result[0].count;
  }

  static async update(id, userData) {
    const { name, email, role, position, department, phone, address, hire_date, salary, is_active } = userData;
    const [result] = await db.query(
      'UPDATE users SET name = ?, email = ?, role = ?, position = ?, department = ?, phone = ?, address = ?, hire_date = ?, salary = ?, is_active = ? WHERE id = ?',
      [name, email, role, position, department, phone, address, hire_date, salary, is_active, id]
    );
    return result.affectedRows > 0;
  }

  static async search(searchTerm) {
    const [rows] = await db.query(
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE name LIKE ? OR email LIKE ? OR position LIKE ? OR department LIKE ? ORDER BY name ASC',
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows;
  }

  static async getActiveUsers() {
    const [rows] = await db.query(
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE is_active = 1 ORDER BY name ASC'
    );
    return rows;
  }

  static async getByDepartment(department) {
    const [rows] = await db.query(
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE department = ? ORDER BY name ASC',
      [department]
    );
    return rows;
  }
}

module.exports = User;
