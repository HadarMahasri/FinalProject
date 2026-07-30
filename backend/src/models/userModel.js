const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error in UserModel.findByEmail:', err.message);
      return null;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error in UserModel.findById:', err.message);
      return null;
    }
  }

  static async createUser({ name, email, password_hash, role = 'customer', phone = null }) {
    try {
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
        [name, email, password_hash, role, phone]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in UserModel.createUser:', err.message);
      throw err;
    }
  }

  static async getAllUsers() {
    try {
      const [rows] = await db.query('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC');
      return rows;
    } catch (err) {
      console.error('Error in UserModel.getAllUsers:', err.message);
      return [];
    }
  }
}

module.exports = UserModel;
