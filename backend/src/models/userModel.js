const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error in UserModel.findByEmail:', err.message);
      throw err;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.query('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error in UserModel.findById:', err.message);
      throw err;
    }
  }

  static async createUser({ name, email, password_hash, role = 'customer', phone }) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
        [name, cleanEmail, password_hash, role, phone || null]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in UserModel.createUser:', err.message);
      throw err;
    }
  }

  static async updateUserPhone(userId, phone) {
    try {
      await db.query('UPDATE users SET phone = ? WHERE id = ?', [phone, userId]);
      return true;
    } catch (err) {
      console.error('Error in UserModel.updateUserPhone:', err.message);
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
