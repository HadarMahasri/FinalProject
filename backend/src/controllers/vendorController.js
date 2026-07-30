const VendorModel = require('../models/vendorModel');
const ReviewModel = require('../models/reviewModel');

async function getVendors(req, res) {
  try {
    const { category, location, maxPrice } = req.query;
    const vendors = await VendorModel.getAllVendors({ category, location, maxPrice });
    res.json(vendors);
  } catch (error) {
    console.error('Error in vendorController.getVendors:', error);
    res.status(500).json({ message: 'שגיאה בשליפת רשימת הספקים.' });
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
    const reviews = await ReviewModel.getVendorReviews(id);

    res.json({
      ...vendor,
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

    await VendorModel.updateVendorProfile(vendor.id, req.body);
    const updatedVendor = await VendorModel.getVendorById(vendor.id);
    res.json({ message: 'הפרופיל עודכן בהצלחה!', vendor: updatedVendor });
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

    // If vendor has no cover image, set this as cover
    if (!vendor.cover_image) {
      await VendorModel.updateVendorProfile(vendor.id, { cover_image: filePath });
    }

    res.json({
      message: 'הקובץ הועלה בהצלחה!',
      media: { id: mediaId, vendor_id: vendor.id, file_path: filePath, file_type: req.file.mimetype }
    });
  } catch (error) {
    console.error('Error in vendorController.uploadMedia:', error);
    res.status(500).json({ message: 'שגיאה בהעלאת הקובץ.' });
  }
}

module.exports = {
  getVendors,
  getVendorById,
  updateVendorProfile,
  uploadMedia
};
