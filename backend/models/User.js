// Task Owner: Muhtari Anwar - Employee Directory (Users CRUD)
const db = require('../config/database');

class User {
  static async create(userData) {
<<<<<<< HEAD
    const { name, email, password, role = 'user', position, department, phone, address, hire_date, salary } = userData;
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, position, department, phone, address, hire_date, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, role, position, department, phone, address, hire_date, salary]
    );
    return { id: result.insertId, ...userData };
=======
    const {
      name,
      email,
      password,
      role = 'user',
      position = null,
      department = null
    } = userData;
  
    const is_admin = role === 'admin' ? 1 : 0;
  
    const [result] = await db.query(
      `INSERT INTO users
        (name,email,password,position,department,is_admin)
        VALUES (?,?,?,?,?,?)`,
      [
        name,
        email,
        password,
        position,
        department,
        is_admin
      ]
    );
  
    return {
      id: result.insertId,
      name,
      email,
      role,
      position,
      department
    };
>>>>>>> origin/gojiberry
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
<<<<<<< HEAD
      'SELECT id, name, email, password, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
=======
      `SELECT 
        id,
        name,
        email,
        password,
        position,
        department,
        is_admin,
        created_at
       FROM users
       WHERE email = ?`,
      [email]
    );
  
    if (!rows[0]) return null;
  
    return {
      ...rows[0],
      role: rows[0].is_admin ? 'admin' : 'user'
    };
>>>>>>> origin/gojiberry
  }

  static async findById(id) {
    const [rows] = await db.query(
<<<<<<< HEAD
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
=======
      `SELECT
        id,
        name,
        email,
        position,
        department,
        is_admin,
        created_at
       FROM users
       WHERE id = ?`,
      [id]
    );
  
    if (!rows[0]) return null;
  
    return {
      ...rows[0],
      role: rows[0].is_admin ? 'admin' : 'user'
    };
>>>>>>> origin/gojiberry
  }

  static async getAll() {
    const [rows] = await db.query(
<<<<<<< HEAD
      'SELECT id, name, email, role, position, department, phone, address, hire_date, salary, is_active, created_at FROM users ORDER BY id DESC'
    );
    return rows;
=======
      `SELECT
        id,
        name,
        email,
        position,
        department,
        is_admin,
        created_at
       FROM users
       ORDER BY id DESC`
    );
  
    return rows.map(user => ({
      ...user,
      role: user.is_admin ? 'admin' : 'user'
    }));
>>>>>>> origin/gojiberry
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
<<<<<<< HEAD
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1',
      ['admin']
    );
=======
      'SELECT COUNT(*) as count FROM users WHERE is_admin = 1'
    );
  
>>>>>>> origin/gojiberry
    return result[0].count;
  }

  static async update(id, userData) {
    const { name, email, role, position, department, phone, address, hire_date, salary, is_active } = userData;
    
    // Build dynamic update query to handle partial updates
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }
    if (department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(department);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (hire_date !== undefined) {
      updateFields.push('hire_date = ?');
      updateValues.push(hire_date);
    }
    if (salary !== undefined) {
      updateFields.push('salary = ?');
      updateValues.push(salary);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    
    if (updateFields.length === 0) {
      return false; // No fields to update
    }
    
    const [result] = await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      [...updateValues, id]
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
