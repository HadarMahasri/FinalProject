const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, requireRole(['customer', 'admin']), eventController.createEvent);
router.put('/:id', authenticateToken, requireRole(['customer', 'admin']), eventController.updateEvent);
router.delete('/:id', authenticateToken, requireRole(['customer', 'admin']), eventController.deleteEvent);

router.get('/my-events', authenticateToken, requireRole(['customer']), eventController.getCustomerEvents);
router.post('/book', authenticateToken, requireRole(['customer']), eventController.createBooking);
router.get('/vendor-bookings', authenticateToken, requireRole(['vendor']), eventController.getVendorBookings);
router.get('/customer-bookings', authenticateToken, requireRole(['customer']), eventController.getCustomerBookings);
router.put('/booking/:id/status', authenticateToken, requireRole(['vendor', 'customer']), eventController.updateBookingStatus);

module.exports = router;
