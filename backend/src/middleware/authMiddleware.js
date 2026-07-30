const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'גישה נדחתה. נא להתחבר למערכת.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'טוקן אינו תקף או פג תוקפו.' });
    }
    req.user = user;
    next();
  });
}

// Middleware to authorize specific roles (e.g. ['vendor'], ['admin'], ['customer', 'admin'])
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'אין לך הרשאה לבצע פעולה זו.' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
