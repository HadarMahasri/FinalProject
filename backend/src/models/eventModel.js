const db = require('../config/db');

class EventModel {
  static async createEvent({ customer_id, title, event_type, event_date, budget, location, guest_count, notes }) {
    try {
      const [result] = await db.query(
        `INSERT INTO events (customer_id, title, event_type, event_date, budget, location, guest_count, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, title, event_type, event_date, budget || 0, location, guest_count || 0, notes]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in EventModel.createEvent:', err.message);
      throw err;
    }
  }

  static async updateEvent(eventId, customerId, { title, event_type, event_date, budget, location, guest_count, notes }) {
    try {
      const [result] = await db.query(
        `UPDATE events 
         SET title = ?, event_type = ?, event_date = ?, budget = ?, location = ?, guest_count = ?, notes = ?
         WHERE id = ? AND customer_id = ?`,
        [title, event_type, event_date, budget || 0, location, guest_count || 0, notes, eventId, customerId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in EventModel.updateEvent:', err.message);
      throw err;
    }
  }

  static async deleteEvent(eventId, customerId) {
    try {
      const [result] = await db.query('DELETE FROM events WHERE id = ? AND customer_id = ?', [eventId, customerId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Error in EventModel.deleteEvent:', err.message);
      throw err;
    }
  }

  static async getEventsByCustomerId(customerId) {
    try {
      const [rows] = await db.query('SELECT * FROM events WHERE customer_id = ? ORDER BY event_date ASC', [customerId]);
      return rows;
    } catch (err) {
      console.error('Error in EventModel.getEventsByCustomerId:', err.message);
      return [];
    }
  }

  static async getEventById(eventId) {
    try {
      const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
      return rows[0] || null;
    } catch (err) {
      console.error('Error in EventModel.getEventById:', err.message);
      return null;
    }
  }

  static async createBooking({ event_id, vendor_id, notes, agreed_price }) {
    try {
      const [result] = await db.query(
        'INSERT INTO bookings (event_id, vendor_id, notes, agreed_price) VALUES (?, ?, ?, ?)',
        [event_id, vendor_id, notes, agreed_price || null]
      );
      return result.insertId;
    } catch (err) {
      console.error('Error in EventModel.createBooking:', err.message);
      throw err;
    }
  }

  static async getBookingsForVendor(vendorId) {
    try {
      const [rows] = await db.query(
        `SELECT b.*, e.title as event_title, e.event_type, e.event_date, e.location, e.guest_count, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         JOIN users u ON e.customer_id = u.id
         WHERE b.vendor_id = ?
         ORDER BY b.created_at DESC`,
        [vendorId]
      );
      return rows;
    } catch (err) {
      console.error('Error in EventModel.getBookingsForVendor:', err.message);
      return [];
    }
  }

  static async getBookingsForCustomer(customerId) {
    try {
      const [rows] = await db.query(
        `SELECT b.*, v.business_name, v.category, v.location as vendor_location, v.cover_image, u.phone as vendor_phone, e.title as event_title
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         JOIN vendors v ON b.vendor_id = v.id
         JOIN users u ON v.user_id = u.id
         WHERE e.customer_id = ?
         ORDER BY b.created_at DESC`,
        [customerId]
      );
      return rows;
    } catch (err) {
      console.error('Error in EventModel.getBookingsForCustomer:', err.message);
      return [];
    }
  }

  static async updateBookingStatus(bookingId, status) {
    try {
      await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
      return true;
    } catch (err) {
      console.error('Error in EventModel.updateBookingStatus:', err.message);
      throw err;
    }
  }
}

module.exports = EventModel;
