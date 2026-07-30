const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireRole(['admin']));

router.get('/stats', adminController.getAdminStats);
router.get('/pending-vendors', adminController.getPendingVendors);
router.put('/vendor/:vendorId/approve', adminController.approveVendor);
router.get('/users', adminController.getAllUsers);

module.exports = router;
