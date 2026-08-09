const db = require('../config/db');

class VendorModel {
  static async getAllVendors(filters = {}) {
    try {
      // Default to 6 items per page unless explicitly requesting 'all'
      const isUnlimited = filters.limit === 'all' || filters.all === 'true' || filters.all === true;
      const limitVal = isUnlimited ? null : (parseInt(filters.limit, 10) || 6);
      const pageVal = parseInt(filters.page, 10) || 1;

      // 1. Calculate total count matching filters
      let countQuery = `
        SELECT COUNT(*) as total
        FROM vendors v 
        JOIN users u ON v.user_id = u.id 
        WHERE 1=1
      `;
      const countParams = [];

      if (filters.category && filters.category !== 'all') {
        countQuery += ' AND v.category = ?';
        countParams.push(filters.category);
      }
      if (filters.location) {
        countQuery += ' AND v.location LIKE ?';
        countParams.push(`%${filters.location}%`);
      }
      if (filters.maxPrice) {
        countQuery += ' AND v.starting_price <= ?';
        countParams.push(Number(filters.maxPrice));
      }
      if (filters.isApproved !== undefined) {
        countQuery += ' AND v.is_approved = ?';
        countParams.push(filters.isApproved);
      } else {
        countQuery += ' AND v.is_approved = TRUE';
      }

      const [countRows] = await db.query(countQuery, countParams);
      const totalCount = countRows[0]?.total || 0;

      // 2. Build main query
      let query = `
        SELECT 
          v.id, v.business_name, v.category, v.location, v.starting_price, v.cover_image, u.phone,
          COALESCE(r.review_count, 0) as review_count,
          COALESCE(ROUND(r.rating_avg, 2), 0.00) as rating_avg
        FROM vendors v 
        JOIN users u ON v.user_id = u.id 
        LEFT JOIN (
          SELECT vendor_id, COUNT(*) as review_count, AVG(rating) as rating_avg 
          FROM reviews 
          GROUP BY vendor_id
        ) r ON v.id = r.vendor_id
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
        query += ' AND v.is_approved = TRUE';
      }

      query += ' ORDER BY rating_avg DESC, v.created_at DESC';

      if (limitVal) {
        const offsetVal = Math.max(0, (pageVal - 1) * limitVal);
        query += ` LIMIT ${limitVal} OFFSET ${offsetVal}`;
      }

      const [rows] = await db.query(query, queryParams);

      if (limitVal) {
        const fetchedSoFar = (pageVal - 1) * limitVal + rows.length;
        return {
          vendors: rows,
          totalCount,
          page: pageVal,
          limit: limitVal,
          hasMore: fetchedSoFar < totalCount
        };
      }

      return rows;
    } catch (err) {
      console.error('Error in VendorModel.getAllVendors:', err.message);
      return { vendors: [], totalCount: 0, hasMore: false };
    }
  }

  static async getVendorById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
           v.id, v.user_id, v.business_name, v.category, v.description, v.location, v.starting_price, v.is_approved, v.cover_image, v.created_at,
           u.name as owner_name, u.email, u.phone,
           COALESCE(r.review_count, 0) as review_count,
           COALESCE(ROUND(r.rating_avg, 2), 0.00) as rating_avg
         FROM vendors v 
         JOIN users u ON v.user_id = u.id 
         LEFT JOIN (
           SELECT vendor_id, COUNT(*) as review_count, AVG(rating) as rating_avg 
           FROM reviews 
           GROUP BY vendor_id
         ) r ON v.id = r.vendor_id
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

      if (data.description !== undefined) {
        fields.push('description = ?');
        values.push(data.description);
      }
      if (data.location !== undefined) {
        fields.push('location = ?');
        values.push(data.location);
      }
      if (data.starting_price !== undefined) {
        fields.push('starting_price = ?');
        values.push(data.starting_price);
      }
      if (data.business_name !== undefined) {
        fields.push('business_name = ?');
        values.push(data.business_name);
      }
      if (data.category !== undefined) {
        fields.push('category = ?');
        values.push(data.category);
      }
      if (data.cover_image !== undefined) {
        fields.push('cover_image = ?');
        values.push(data.cover_image);
      }

      if (fields.length === 0) return false;

      values.push(vendorId);
      const sql = `UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(sql, values);
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
      const [rows] = await db.query('SELECT id, file_path FROM media WHERE vendor_id = ? ORDER BY created_at DESC', [vendorId]);
      return rows;
    } catch (err) {
      console.error('Error in VendorModel.getVendorMedia:', err.message);
      return [];
    }
  }

  static async getVendorReviews(vendorId) {
    try {
      const [rows] = await db.query(
        `SELECT r.id, r.rating, r.comment, u.name as customer_name 
         FROM reviews r 
         JOIN users u ON r.customer_id = u.id 
         WHERE r.vendor_id = ? 
         ORDER BY r.created_at DESC`,
        [vendorId]
      );
      return rows;
    } catch (err) {
      console.error('Error in VendorModel.getVendorReviews:', err.message);
      return [];
    }
  }
}

module.exports = VendorModel;
