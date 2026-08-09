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

    res.status(201).json({ message: 'האירוע נוצר בהצלחה!', id: eventId });
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
    const { event_id, vendor_id, notes } = req.body;

    if (!event_id || !vendor_id) {
      return res.status(400).json({ message: 'נא לספק מזהה אירוע ומזהה ספק.' });
    }

    // Verify the event actually belongs to the customer making the request —
    // otherwise anyone could attach booking requests to someone else's event.
    const event = await EventModel.getEventById(event_id);
    if (!event || Number(event.customer_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'אין לך הרשאה לשלוח בקשת הזמנה עבור אירוע זה.' });
    }

    // Never trust a client-supplied price — always price the booking from
    // the vendor's real starting price stored server-side.
    const vendor = await VendorModel.getVendorById(vendor_id);
    if (!vendor) {
      return res.status(404).json({ message: 'ספק לא נמצא.' });
    }

    await EventModel.createBooking({ event_id, vendor_id, notes, agreed_price: vendor.starting_price });
    res.status(201).json({ message: 'בקשת ההזמנה נשלחה לספק בהצלחה!' });
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

    const { limit, page } = req.query;
    const result = await EventModel.getBookingsForVendor(vendor.id, { limit, page });
    res.json(result);
  } catch (error) {
    console.error('Error in eventController.getVendorBookings:', error);
    res.status(500).json({ message: 'שגיאה בשליפת ההזמנות של הספק.' });
  }
}

async function getCustomerBookings(req, res) {
  try {
    const customer_id = req.user.id;
    const { limit, page } = req.query;
    const result = await EventModel.getBookingsForCustomer(customer_id, { limit, page });
    res.json(result);
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

    // Verify the requester is actually one of the two parties on this
    // booking (the vendor it was sent to, or the customer who sent it) —
    // otherwise any logged-in vendor/customer could change any booking.
    const ownership = await EventModel.getBookingOwnership(id);
    if (!ownership) {
      return res.status(404).json({ message: 'הזמנה לא נמצאה.' });
    }

    const isOwningVendor = req.user.role === 'vendor' && Number(ownership.vendor_user_id) === Number(req.user.id);
    const isOwningCustomer = req.user.role === 'customer' && Number(ownership.customer_id) === Number(req.user.id);
    if (!isOwningVendor && !isOwningCustomer) {
      return res.status(403).json({ message: 'אין לך הרשאה לעדכן הזמנה זו.' });
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
