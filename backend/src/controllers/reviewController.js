const ReviewModel = require('../models/reviewModel');

async function addReview(req, res) {
  try {
    const customer_id = req.user.id;
    const { booking_id, vendor_id, rating, comment } = req.body;

    if (!vendor_id || !rating) {
      return res.status(400).json({ message: 'נא לספק מזהה ספק ודירוג (1-5).' });
    }

    const reviewId = await ReviewModel.addReview({
      booking_id,
      customer_id,
      vendor_id,
      rating,
      comment
    });

    res.status(201).json({ message: 'תודה! חוות הדעת התקבלה בהצלחה.', reviewId });
  } catch (error) {
    console.error('Error in reviewController.addReview:', error);
    res.status(500).json({ message: 'שגיאה בהוספת חוות דעת.' });
  }
}

async function getVendorReviews(req, res) {
  try {
    const { vendorId } = req.params;
    const reviews = await ReviewModel.getVendorReviews(vendorId);
    res.json(reviews);
  } catch (error) {
    console.error('Error in reviewController.getVendorReviews:', error);
    res.status(500).json({ message: 'שגיאה בשליפת ביקורות.' });
  }
}

module.exports = {
  addReview,
  getVendorReviews
};
