const UserModel = require('../models/userModel');
const VendorModel = require('../models/vendorModel');
const db = require('../config/db');

async function getAdminStats(req, res) {
  try {
    const [userRows] = await db.query('SELECT COUNT(*) as total FROM users');
    const [vendorRows] = await db.query('SELECT COUNT(*) as total FROM vendors');
    const [pendingVendorRows] = await db.query('SELECT COUNT(*) as total FROM vendors WHERE is_approved = FALSE');
    const [eventRows] = await db.query('SELECT COUNT(*) as total FROM events');
    const [bookingRows] = await db.query('SELECT COUNT(*) as total FROM bookings');

    res.json({
      totalUsers: userRows[0].total,
      totalVendors: vendorRows[0].total,
      pendingVendors: pendingVendorRows[0].total,
      totalEvents: eventRows[0].total,
      totalBookings: bookingRows[0].total
    });
  } catch (error) {
    console.error('Error in adminController.getAdminStats:', error);
    res.status(500).json({ message: 'שגיאה בשליפת נתוני אדמין.' });
  }
}

async function getPendingVendors(req, res) {
  try {
    const vendors = await VendorModel.getAllVendors({ isApproved: false });
    res.json(vendors);
  } catch (error) {
    console.error('Error in adminController.getPendingVendors:', error);
    res.status(500).json({ message: 'שגיאה בשליפת ספקים ממתינים לאישור.' });
  }
}

async function approveVendor(req, res) {
  try {
    const { vendorId } = req.params;
    const { isApproved } = req.body;

    await VendorModel.updateVendorProfile(vendorId, { is_approved: isApproved !== false });
    res.json({ message: `פרופיל הספק ${isApproved !== false ? 'אושר' : 'נדחה'} בהצלחה!` });
  } catch (error) {
    console.error('Error in adminController.approveVendor:', error);
    res.status(500).json({ message: 'שגיאה בעדכון סטטוס אישור ספק.' });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error in adminController.getAllUsers:', error);
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים.' });
  }
}

module.exports = {
  getAdminStats,
  getPendingVendors,
  approveVendor,
  getAllUsers
};
