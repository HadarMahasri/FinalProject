const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, requireRole(['customer']), reviewController.addReview);
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

module.exports = router;
