const db = require('../config/db');

class VendorModel {
  static async getAllVendors(filters = {}) {
    try {
      let query = `
        SELECT v.*, u.name as owner_name, u.email, u.phone 
        FROM vendors v 
        JOIN users u ON v.user_id = u.id 
        WHERE 1=1
      `;
      const queryParams = [];

      if (filters.category && filters.category !== 'all') {
        query += ' AND v.category = ?';
        queryParams.push(filters.category);
      }

      if (filters.location) {
        query += ' AND v.location LIKE ?';
        queryParams.push(`%${filters.location}%`);
      }

      if (filters.maxPrice) {
        query += ' AND v.starting_price <= ?';
        queryParams.push(Number(filters.maxPrice));
      }

      if (filters.isApproved !== undefined) {
        query += ' AND v.is_approved = ?';
        queryParams.push(filters.isApproved);
      } else {
        query += ' AND v.is_approved = TRUE'; // Default to showing only approved
      }

      query += ' ORDER BY v.rating_avg DESC, v.created_at DESC';

      const [rows] = await db.query(query, queryParams);
      return rows;
    } catch (err) {
      console.error('Error in VendorModel.getAllVendors:', err.message);
      return [];
    }
  }

  static async getVendorById(id) {
    try {
      const [rows] = await db.query(
        `SELECT v.*, u.name as owner_name, u.email, u.phone 
         FROM vendors v 
         JOIN users u ON v.user_id = u.id 
         WHERE v.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      console.error('Error in VendorModel.getVendorById:', err.message);
      return null;
    }
  }

  static async getVendorByUserId(userId) {
    try {
      const [rows] = await db.query('SELECT * FROM vendors WHERE user_id = ?', [userId]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error in VendorModel.getVendorByUserId:', err.message);
      return null;
    }
  }

  static async createVendorProfile({ user_id, business_name, category, description, location, starting_price, cover_image = null }) {
    try {
      const [result] = await db.query(
        `INSERT INTO vendors (user_id, business_name, category, description, location, starting_price, cover_image, is_approved) 
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [user_id, business_name, category, description, location, starting_price, cover_image]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in VendorModel.createVendorProfile:', err.message);
      throw err;
    }
  }

  static async updateVendorProfile(vendorId, data) {
    try {
      const fields = [];
      const values = [];

      if (data.business_name) { fields.push('business_name = ?'); values.push(data.business_name); }
      if (data.category) { fields.push('category = ?'); values.push(data.category); }
      if (data.description) { fields.push('description = ?'); values.push(data.description); }
      if (data.location) { fields.push('location = ?'); values.push(data.location); }
      if (data.starting_price !== undefined) { fields.push('starting_price = ?'); values.push(data.starting_price); }
      if (data.cover_image) { fields.push('cover_image = ?'); values.push(data.cover_image); }
      if (data.is_approved !== undefined) { fields.push('is_approved = ?'); values.push(data.is_approved); }

      if (fields.length === 0) return true;

      values.push(vendorId);
      await db.query(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, values);
      return true;
    } catch (err) {
      console.error('Error in VendorModel.updateVendorProfile:', err.message);
      throw err;
    }
  }

  static async addMedia(vendorId, filePath, fileType = 'image') {
    try {
      const [result] = await db.query(
        'INSERT INTO media (vendor_id, file_path, file_type) VALUES (?, ?, ?)',
        [vendorId, filePath, fileType]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in VendorModel.addMedia:', err.message);
      throw err;
    }
  }

  static async getVendorMedia(vendorId) {
    try {
      const [rows] = await db.query('SELECT * FROM media WHERE vendor_id = ? ORDER BY created_at DESC', [vendorId]);
      return rows;
    } catch (err) {
      console.error('Error in VendorModel.getVendorMedia:', err.message);
      return [];
    }
  }
}

module.exports = VendorModel;
