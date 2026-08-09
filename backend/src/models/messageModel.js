const db = require('../config/db');

class MessageModel {
  static async createMessage({ sender_id, receiver_id, booking_id, content }) {
    try {
      const [result] = await db.query(
        'INSERT INTO messages (sender_id, receiver_id, booking_id, content) VALUES (?, ?, ?, ?)',
        [sender_id, receiver_id, booking_id || null, content]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in MessageModel.createMessage:', err.message);
      throw err;
    }
  }

  static async getConversation(userId, otherUserId) {
    try {
      const [rows] = await db.query(
        `SELECT m.id, m.sender_id, m.receiver_id, m.booking_id, m.content, m.is_read, m.created_at,
                u.name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (m.sender_id = ? AND m.receiver_id = ?) 
            OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.created_at ASC`,
        [userId, otherUserId, otherUserId, userId]
      );
      return rows;
    } catch (err) {
      console.error('Error in MessageModel.getConversation:', err.message);
      return [];
    }
  }

  static async getConversationsList(userId) {
    try {
      const [rows] = await db.query(
        `SELECT 
            c.other_user_id,
            u.name as other_user_name,
            u.role as other_user_role,
            CASE WHEN u.role = 'vendor' THEN v.business_name ELSE NULL END as business_name,
            (SELECT m1.content FROM messages m1 
             WHERE (m1.sender_id = ? AND m1.receiver_id = c.other_user_id) 
                OR (m1.sender_id = c.other_user_id AND m1.receiver_id = ?)
             ORDER BY m1.created_at DESC LIMIT 1) as last_message,
            COALESCE(
              (SELECT m2.created_at FROM messages m2 
               WHERE (m2.sender_id = ? AND m2.receiver_id = c.other_user_id) 
                  OR (m2.sender_id = c.other_user_id AND m2.receiver_id = ?)
               ORDER BY m2.created_at DESC LIMIT 1),
              '2026-01-01 00:00:00'
            ) as last_message_time,
            (SELECT COUNT(*) FROM messages m3 
             WHERE m3.sender_id = c.other_user_id AND m3.receiver_id = ? AND m3.is_read = FALSE) as unread_count
         FROM (
           SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id
           FROM messages 
           WHERE sender_id = ? OR receiver_id = ?
           
           UNION
           
           SELECT e.customer_id as other_user_id
           FROM bookings b
           JOIN events e ON b.event_id = e.id
           JOIN vendors v ON b.vendor_id = v.id
           WHERE v.user_id = ? AND b.status = 'approved'

           UNION

           SELECT v.user_id as other_user_id
           FROM bookings b
           JOIN events e ON b.event_id = e.id
           JOIN vendors v ON b.vendor_id = v.id
           WHERE e.customer_id = ? AND b.status = 'approved'
         ) c
         JOIN users u ON u.id = c.other_user_id
         LEFT JOIN vendors v ON v.user_id = u.id
         GROUP BY c.other_user_id, u.name, u.role, v.business_name, v.id
         ORDER BY last_message_time DESC`,
        [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]
      );
      return rows;
    } catch (err) {
      console.error('Error in MessageModel.getConversationsList:', err.message);
      return [];
    }
  }

  static async markAsRead(userId, otherUserId) {
    try {
      await db.query(
        'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
        [otherUserId, userId]
      );
      return true;
    } catch (err) {
      console.error('Error in MessageModel.markAsRead:', err.message);
      return false;
    }
  }

  static async getUnreadTotalCount(userId) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as unread FROM messages WHERE receiver_id = ? AND is_read = FALSE',
        [userId]
      );
      return rows[0]?.unread || 0;
    } catch (err) {
      console.error('Error in MessageModel.getUnreadTotalCount:', err.message);
      return 0;
    }
  }
}

module.exports = MessageModel;
