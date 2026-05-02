// Task Owner: Ahmad Ghazy Hibatullah - Announcements (Pengumuman)
const db = require('../config/database');

class Announcement {
  static async create(announcementData) {
    const { 
      title, 
      content, 
      created_by, 
      category = 'general', 
      priority = 'medium', 
      expiry_date = null,
      is_active = true 
    } = announcementData;
    
    const [result] = await db.query(
      'INSERT INTO announcements (title, content, created_by, category, priority, expiry_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, created_by, category, priority, expiry_date, is_active]
    );
    
    return { 
      id: result.insertId, 
      title, 
      content, 
      created_by, 
      category, 
      priority, 
      expiry_date, 
      is_active,
      created_at: new Date().toISOString()
    };
  }

  static async createManual(announcementData) {
    // Special method for manual announcement creation with validation
    const { title, content, created_by, category, priority, expiry_date } = announcementData;
    
    // Validation
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }
    if (!created_by) {
      throw new Error('Created by user ID is required');
    }
    
    // Validate category
    const validCategories = ['general', 'policy', 'event', 'urgent'];
    if (category && !validCategories.includes(category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }
    
    return await this.create({
      title: title.trim(),
      content: content.trim(),
      created_by,
      category: category || 'general',
      priority: priority || 'medium',
      expiry_date: expiry_date || null,
      is_active: true
    });
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE a.is_active = TRUE 
      ORDER BY a.priority DESC, a.id DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE a.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async updateViewCount(id) {
    const [result] = await db.query(
      'UPDATE announcements SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async update(id, announcementData) {
    const { title, content, category, priority, is_active, expiry_date } = announcementData;
    const [result] = await db.query(
      'UPDATE announcements SET title = ?, content = ?, category = ?, priority = ?, is_active = ?, expiry_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, category, priority, is_active, expiry_date, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM announcements WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async deletePermanent(id) {
    // Permanent deletion with verification
    const announcement = await this.findById(id);
    if (!announcement) {
      throw new Error('Announcement not found');
    }
    
    const [result] = await db.query(
      'DELETE FROM announcements WHERE id = ?',
      [id]
    );
    
    return {
      success: result.affectedRows > 0,
      deletedAnnouncement: announcement
    };
  }

  static async softDelete(id) {
    // Soft delete by setting is_active to false
    const [result] = await db.query(
      'UPDATE announcements SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getExpired() {
    const [rows] = await db.query(
      'SELECT * FROM announcements WHERE expiry_date < CURDATE() AND is_active = TRUE'
    );
    return rows;
  }

  static async getByCategory(category) {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE a.category = ? AND a.is_active = TRUE 
      ORDER BY a.priority DESC, a.id DESC
    `, [category]);
    return rows;
  }

  static async getByPriority(priority) {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE a.priority = ? AND a.is_active = TRUE 
      ORDER BY a.id DESC
    `, [priority]);
    return rows;
  }

  static async search(searchTerm) {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE (a.title LIKE ? OR a.content LIKE ?) AND a.is_active = TRUE 
      ORDER BY a.priority DESC, a.id DESC
    `, [`%${searchTerm}%`, `%${searchTerm}%`]);
    return rows;
  }

  static async getAllIncludingInactive() {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      ORDER BY a.id DESC
    `);
    return rows;
  }

  static async getActiveOnly() {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE a.is_active = TRUE 
      ORDER BY a.priority DESC, a.id DESC
    `);
    return rows;
  }

  static async getInactiveOnly() {
    const [rows] = await db.query(`
      SELECT a.*, u.name as creator_name, u.email as creator_email 
      FROM announcements a 
      JOIN users u ON a.created_by = u.id 
      WHERE a.is_active = FALSE 
      ORDER BY a.id DESC
    `);
    return rows;
  }
}

module.exports = Announcement;
