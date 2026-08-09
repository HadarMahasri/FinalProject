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

  static async updateEvent(eventId, customerId, data) {
    try {
      const fields = [];
      const values = [];

      if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
      if (data.event_type !== undefined) { fields.push('event_type = ?'); values.push(data.event_type); }
      if (data.event_date !== undefined) { fields.push('event_date = ?'); values.push(data.event_date); }
      if (data.budget !== undefined) { fields.push('budget = ?'); values.push(data.budget); }
      if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
      if (data.guest_count !== undefined) { fields.push('guest_count = ?'); values.push(data.guest_count); }
      if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

      if (fields.length === 0) return true;

      values.push(eventId, customerId);
      const [result] = await db.query(`UPDATE events SET ${fields.join(', ')} WHERE id = ? AND customer_id = ?`, values);
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
      const [rows] = await db.query(
        `SELECT id, customer_id, title, event_type, event_date, budget, location, guest_count, notes 
         FROM events 
         WHERE customer_id = ? 
         ORDER BY event_date ASC`,
        [customerId]
      );
      return rows;
    } catch (err) {
      console.error('Error in EventModel.getEventsByCustomerId:', err.message);
      return [];
    }
  }

  static async getEventById(eventId) {
    try {
      const [rows] = await db.query(
        `SELECT id, customer_id, title, event_type, event_date, budget, location, guest_count, notes 
         FROM events 
         WHERE id = ?`,
        [eventId]
      );
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

  static async getBookingsForVendor(vendorId, filters = {}) {
    try {
      const isUnlimited = filters.limit === 'all' || filters.all === 'true' || filters.all === true;
      const limitVal = isUnlimited ? null : (parseInt(filters.limit, 10) || 5);
      const pageVal = parseInt(filters.page, 10) || 1;

      // Calculate total count
      const [countRows] = await db.query('SELECT COUNT(*) as total FROM bookings WHERE vendor_id = ?', [vendorId]);
      const totalCount = countRows[0]?.total || 0;

      let query = `
        SELECT 
           b.id, b.event_id, b.status, b.agreed_price, b.notes, e.customer_id,
           e.title as event_title, e.event_type, e.event_date, e.location, e.guest_count, 
           u.name as customer_name, u.phone as customer_phone, u.email as customer_email
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         JOIN users u ON e.customer_id = u.id
         WHERE b.vendor_id = ?
         ORDER BY b.created_at DESC
      `;

      if (limitVal) {
        const offsetVal = Math.max(0, (pageVal - 1) * limitVal);
        query += ` LIMIT ${limitVal} OFFSET ${offsetVal}`;
      }

      const [rows] = await db.query(query, [vendorId]);

      if (limitVal) {
        const fetchedSoFar = (pageVal - 1) * limitVal + rows.length;
        return {
          bookings: rows,
          totalCount,
          page: pageVal,
          limit: limitVal,
          hasMore: fetchedSoFar < totalCount
        };
      }

      return rows;
    } catch (err) {
      console.error('Error in EventModel.getBookingsForVendor:', err.message);
      return filters.limit ? { bookings: [], totalCount: 0, hasMore: false } : [];
    }
  }

  static async getBookingsForCustomer(customerId, filters = {}) {
    try {
      const isUnlimited = filters.limit === 'all' || filters.all === 'true' || filters.all === true;
      const limitVal = isUnlimited ? null : (parseInt(filters.limit, 10) || 5);
      const pageVal = parseInt(filters.page, 10) || 1;

      // Calculate total count
      const [countRows] = await db.query(
        `SELECT COUNT(*) as total 
         FROM bookings b 
         JOIN events e ON b.event_id = e.id 
         WHERE e.customer_id = ?`,
        [customerId]
      );
      const totalCount = countRows[0]?.total || 0;

      let query = `
        SELECT 
           b.id, b.event_id, b.status, b.agreed_price, b.notes, 
           v.business_name, 
           u.phone as vendor_phone, 
           e.title as event_title
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         JOIN vendors v ON b.vendor_id = v.id
         JOIN users u ON v.user_id = u.id
         WHERE e.customer_id = ?
         ORDER BY b.created_at DESC
      `;

      if (limitVal) {
        const offsetVal = Math.max(0, (pageVal - 1) * limitVal);
        query += ` LIMIT ${limitVal} OFFSET ${offsetVal}`;
      }

      const [rows] = await db.query(query, [customerId]);

      if (limitVal) {
        const fetchedSoFar = (pageVal - 1) * limitVal + rows.length;
        return {
          bookings: rows,
          totalCount,
          page: pageVal,
          limit: limitVal,
          hasMore: fetchedSoFar < totalCount
        };
      }

      return rows;
    } catch (err) {
      console.error('Error in EventModel.getBookingsForCustomer:', err.message);
      return filters.limit ? { bookings: [], totalCount: 0, hasMore: false } : [];
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
