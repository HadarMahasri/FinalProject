const VendorModel = require('../models/vendorModel');
const UserModel = require('../models/userModel');

async function getAllVendors(req, res) {
  try {
    const { category, location, max_price, maxPrice, search, limit, page } = req.query;
    const effectiveMaxPrice = maxPrice || max_price;

    const result = await VendorModel.getAllVendors({
      category,
      location,
      maxPrice: effectiveMaxPrice,
      search,
      limit,
      page
    });

    res.json(result);
  } catch (error) {
    console.error('Error in vendorController.getAllVendors:', error);
    res.status(500).json({ message: 'שגיאה בשליפת קטלוג הספקים.' });
  }
}

async function getVendorById(req, res) {
  try {
    const { id } = req.params;
    const vendor = await VendorModel.getVendorById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'ספק לא נמצא.' });
    }

    const media = await VendorModel.getVendorMedia(id);
    const reviews = await VendorModel.getVendorReviews(id);

    // Synchronize review_count and rating_avg dynamically from actual reviews
    const reviewCount = reviews.length;
    const ratingAvg = reviewCount > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount).toFixed(1)
      : 0;

    res.json({
      ...vendor,
      rating_avg: Number(ratingAvg),
      review_count: reviewCount,
      media,
      reviews
    });
  } catch (error) {
    console.error('Error in vendorController.getVendorById:', error);
    res.status(500).json({ message: 'שגיאה בשליפת פרטי הספק.' });
  }
}

async function updateVendorProfile(req, res) {
  try {
    const userId = req.user.id;
    const vendor = await VendorModel.getVendorByUserId(userId);
    if (!vendor) {
      return res.status(404).json({ message: 'פרופיל ספק לא נמצא.' });
    }

    const { description, location, starting_price, business_name, category, phone } = req.body;

    await VendorModel.updateVendorProfile(vendor.id, {
      description,
      location,
      starting_price,
      business_name,
      category
    });

    if (phone !== undefined) {
      await UserModel.updateUserPhone(userId, phone);
    }

    res.json({ message: 'פרופיל העסק עודכן בהצלחה!' });
  } catch (error) {
    console.error('Error in vendorController.updateVendorProfile:', error);
    res.status(500).json({ message: 'שגיאה בעדכון פרופיל הספק.' });
  }
}

async function uploadMedia(req, res) {
  try {
    const userId = req.user.id;
    const vendor = await VendorModel.getVendorByUserId(userId);
    if (!vendor) {
      return res.status(404).json({ message: 'פרופיל ספק לא נמצא.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'לא נבחר קובץ להעלאה.' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    const mediaId = await VendorModel.addMedia(vendor.id, filePath, req.file.mimetype.startsWith('image') ? 'image' : 'document');

    if (!vendor.cover_image) {
      await VendorModel.updateVendorProfile(vendor.id, { cover_image: filePath });
    }

    res.json({ message: 'הקובץ הועלה בהצלחה!', id: mediaId, file_path: filePath });
  } catch (error) {
    console.error('Error in vendorController.uploadMedia:', error);
    res.status(500).json({ message: 'שגיאה בהעלאת קובץ.' });
  }
}

module.exports = {
  getAllVendors,
  getVendorById,
  updateVendorProfile,
  uploadMedia
};
