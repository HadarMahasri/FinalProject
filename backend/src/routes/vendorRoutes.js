const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', vendorController.getVendors);
router.get('/:id', vendorController.getVendorById);
router.put('/profile', authenticateToken, requireRole(['vendor']), vendorController.updateVendorProfile);
router.post('/upload', authenticateToken, requireRole(['vendor']), upload.single('file'), vendorController.uploadMedia);

module.exports = router;
