const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const VendorModel = require('../models/vendorModel');

async function register(req, res) {
  try {
    const { name, email, password, role = 'customer', phone, business_name, category, description, location, starting_price } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'נא למלא את כל שדות החובה: שם, אימייל וסיסמה.' });
    }

    // Phone validation: Must be 10 digits if provided
    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (phone && cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'מספר טלפון אינו תקין. יש להזין מספר טלפון בן 10 ספרות (לדוגמה: 0501234567).' });
    }

    // Price validation for vendor: Must be >= 0
    let parsedPrice = 0;
    if (role === 'vendor') {
      parsedPrice = Number(starting_price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: 'מחיר פתיחה חייב להיות מספר תקין (0 ומעלה).' });
      }
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await UserModel.findByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'משתמש עם כתובת אימייל זו כבר קיים במערכת.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const userId = await UserModel.createUser({
      name,
      email: cleanEmail,
      password_hash,
      role,
      phone: cleanPhone || phone || null
    });

    // If registering as vendor, create initial vendor profile
    let vendorId = null;
    if (role === 'vendor') {
      if (!business_name || !category) {
        return res.status(400).json({ message: 'נא למלא שם עסק וקטגוריה עבור הרשמת ספק.' });
      }
      vendorId = await VendorModel.createVendorProfile({
        user_id: userId,
        business_name,
        category,
        description: description || '',
        location: location || 'מרכז',
        starting_price: parsedPrice
      });
    }

    const token = jwt.sign(
      { id: userId, email: cleanEmail, role, name, vendorId },
      process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'הרשמה בוצעה בהצלחה!',
      token,
      user: { id: userId, name, email: cleanEmail, role, phone: cleanPhone || phone, vendorId }
    });

  } catch (error) {
    console.error('Error in authController.register:', error);
    res.status(500).json({ message: 'שגיאה בביצוע הרשמה.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'נא למלא אימייל וסיסמה.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(cleanEmail);
    if (!user) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים.' });
    }

    let isMatch = false;

    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = (password === user.password_hash);
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'פרטי התחברות שגויים.' });
    }

    let vendorId = null;
    if (user.role === 'vendor') {
      const vendor = await VendorModel.getVendorByUserId(user.id);
      if (vendor) vendorId = vendor.id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, vendorId },
      process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'התחברות בוצעה בהצלחה!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vendorId
      }
    });
  } catch (error) {
    console.error('Error in authController.login:', error);
    res.status(500).json({ message: 'שגיאה בביצוע התחברות.' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא.' });
    }

    let vendorProfile = null;
    if (user.role === 'vendor') {
      const basicVendor = await VendorModel.getVendorByUserId(user.id);
      if (basicVendor) {
        vendorProfile = await VendorModel.getVendorById(basicVendor.id);
        const media = await VendorModel.getVendorMedia(basicVendor.id);
        if (vendorProfile) {
          vendorProfile.media = media;
        }
      }
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      vendorProfile
    });
  } catch (error) {
    console.error('Error in authController.getProfile:', error);
    res.status(500).json({ message: 'שגיאה בשליפת פרופיל.' });
  }
}

module.exports = {
  register,
  login,
  getProfile
};
