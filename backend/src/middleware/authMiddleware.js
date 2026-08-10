const jwt = require('jsonwebtoken');

// מידלוור לאימות טוקן JWT בכל קריאה מוגנת לשרת
function authenticateToken(req, res, next) {
  // 1. שליפת כותרת ה-Authorization מהבקשה הנכנסת
  const authHeader = req.headers['authorization'];
  // 2. חילוץ מחרוזת ה-Token מתוך הפורמט: "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  // אם המשתמש לא שלח טוקן - מחזירים שגיאת 401 (לא מחובר)
  if (!token) {
    return res.status(401).json({ message: 'גישה נדחתה. נא להתחבר למערכת.' });
  }

  // 3. אימות חתימת הטוקן המוצפן בעזרת המפתח הסודי JWT_SECRET
  jwt.verify(token, process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'טוקן אינו תקף או פג תוקפו.' });
    }
    // אם הטוקן תקין - שומרים את אובייקט המשתמש (id, email, role) ב-req.user למעבר לבא בתור
    req.user = user;
    next();
  });
}

// מידלוור לבדיקת הרשאות תפקידים (Role-Based Access Control - RBAC)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    // בודקים האם התפקיד של המשתמש (customer / vendor) נמצא במערך התפקידים המורשים
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'אין לך הרשאה לבצע פעולה זו.' });
    }
    // המשתמש מורשה - ממשיכים ל-Controller
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
