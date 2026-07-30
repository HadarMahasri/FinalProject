const db = require('../config/db');

class ReviewModel {
  static async addReview({ booking_id = null, customer_id, vendor_id, rating, comment }) {
    try {
      const [result] = await db.query(
        'INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [booking_id, customer_id, vendor_id, rating, comment]
      );

      // Recalculate average rating for vendor
      const [avgRows] = await db.query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE vendor_id = ?',
        [vendor_id]
      );

      if (avgRows.length > 0) {
        const newAvg = Number(avgRows[0].avg_rating).toFixed(2);
        const newCount = avgRows[0].review_count;
        await db.query(
          'UPDATE vendors SET rating_avg = ?, review_count = ? WHERE id = ?',
          [newAvg, newCount, vendor_id]
        );
      }

      return result.insertId;
    } catch (err) {
      console.error('Error in ReviewModel.addReview:', err.message);
      throw err;
    }
  }

  static async getVendorReviews(vendorId) {
    try {
      const [rows] = await db.query(
        `SELECT r.*, u.name as customer_name, u.avatar_url
         FROM reviews r
         JOIN users u ON r.customer_id = u.id
         WHERE r.vendor_id = ?
         ORDER BY r.created_at DESC`,
        [vendorId]
      );
      return rows;
    } catch (err) {
      console.error('Error in ReviewModel.getVendorReviews:', err.message);
      return [];
    }
  }
}

module.exports = ReviewModel;
