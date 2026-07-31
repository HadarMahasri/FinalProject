const EventModel = require('../models/eventModel');
const VendorModel = require('../models/vendorModel');

async function createEvent(req, res) {
  try {
    const customer_id = req.user.id;
    const { title, event_type, event_date, budget, location, guest_count, notes } = req.body;

    if (!title || !event_type || !event_date) {
      return res.status(400).json({ message: 'נא למלא שם אירוע, סוג אירוע ותאריך.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (event_date < todayStr) {
      return res.status(400).json({ message: 'לא ניתן ליצור אירוע בתאריך שכבר עבר.' });
    }

    const eventId = await EventModel.createEvent({
      customer_id,
      title,
      event_type,
      event_date,
      budget,
      location,
      guest_count,
      notes
    });

    const newEvent = await EventModel.getEventById(eventId);
    res.status(201).json({ message: 'האירוע נוצר בהצלחה!', event: newEvent });
  } catch (error) {
    console.error('Error in eventController.createEvent:', error);
    res.status(500).json({ message: 'שגיאה ביצירת האירוע.' });
  }
}

async function updateEvent(req, res) {
  try {
    const customer_id = req.user.id;
    const { id } = req.params;
    const { title, event_type, event_date, budget, location, guest_count, notes } = req.body;

    if (!title || !event_type || !event_date) {
      return res.status(400).json({ message: 'נא למלא שם אירוע, סוג אירוע ותאריך.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (event_date < todayStr) {
      return res.status(400).json({ message: 'לא ניתן לעדכן אירוע לתאריך שכבר עבר.' });
    }

    const updated = await EventModel.updateEvent(id, customer_id, {
      title,
      event_type,
      event_date,
      budget,
      location,
      guest_count,
      notes
    });

    if (!updated) {
      return res.status(404).json({ message: 'אירוע לא נמצא או שאינך מורשה לערוך אותו.' });
    }

    res.json({ message: 'פרטי האירוע עודכנו בהצלחה!' });
  } catch (error) {
    console.error('Error in eventController.updateEvent:', error);
    res.status(500).json({ message: 'שגיאה בעדכון האירוע.' });
  }
}

async function deleteEvent(req, res) {
  try {
    const customer_id = req.user.id;
    const { id } = req.params;

    const deleted = await EventModel.deleteEvent(id, customer_id);
    if (!deleted) {
      return res.status(404).json({ message: 'אירוע לא נמצא.' });
    }

    res.json({ message: 'האירוע שנבחר נמחק בהצלחה.' });
  } catch (error) {
    console.error('Error in eventController.deleteEvent:', error);
    res.status(500).json({ message: 'שגיאה במחיקת האירוע.' });
  }
}

async function getCustomerEvents(req, res) {
  try {
    const customer_id = req.user.id;
    const events = await EventModel.getEventsByCustomerId(customer_id);
    res.json(events);
  } catch (error) {
    console.error('Error in eventController.getCustomerEvents:', error);
    res.status(500).json({ message: 'שגיאה בשליפת האירועים של הלקוח.' });
  }
}

async function createBooking(req, res) {
  try {
    const { event_id, vendor_id, notes, agreed_price } = req.body;

    if (!event_id || !vendor_id) {
      return res.status(400).json({ message: 'נא לספק מזהה אירוע ומזהה ספק.' });
    }

    const bookingId = await EventModel.createBooking({ event_id, vendor_id, notes, agreed_price });
    res.status(201).json({ message: 'בקשת ההזמנה נשלחה לספק בהצלחה!', bookingId });
  } catch (error) {
    console.error('Error in eventController.createBooking:', error);
    res.status(500).json({ message: 'שגיאה בשליחת בקשת ההזמנה.' });
  }
}

async function getVendorBookings(req, res) {
  try {
    const vendor = await VendorModel.getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: 'פרופיל ספק לא נמצא.' });
    }

    const bookings = await EventModel.getBookingsForVendor(vendor.id);
    res.json(bookings);
  } catch (error) {
    console.error('Error in eventController.getVendorBookings:', error);
    res.status(500).json({ message: 'שגיאה בשליפת ההזמנות של הספק.' });
  }
}

async function getCustomerBookings(req, res) {
  try {
    const customer_id = req.user.id;
    const bookings = await EventModel.getBookingsForCustomer(customer_id);
    res.json(bookings);
  } catch (error) {
    console.error('Error in eventController.getCustomerBookings:', error);
    res.status(500).json({ message: 'שגיאה בשליפת הצעות המחיר וההזמנות.' });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'סטטוס לא תקין.' });
    }

    await EventModel.updateBookingStatus(id, status);
    res.json({ message: 'סטטוס ההזמנה עודכן בהצלחה!' });
  } catch (error) {
    console.error('Error in eventController.updateBookingStatus:', error);
    res.status(500).json({ message: 'שגיאה בעדכון סטטוס ההזמנה.' });
  }
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getCustomerEvents,
  createBooking,
  getVendorBookings,
  getCustomerBookings,
  updateBookingStatus
};
