const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

const JWT_SECRET = process.env.JWT_SECRET || 'caseconnect_super_secret_jwt_key_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let account = null;

    if (decoded.role === 'STUDENT') {
      account = await Student.findById(decoded.id);
      if (!account || !account.isActive) {
        return res.status(401).json({ success: false, message: 'Student account is inactive or revoked.' });
      }
    } else {
      account = await User.findById(decoded.id);
      if (!account) {
        // Fallback check in student collection in case token didn't contain explicit role
        account = await Student.findById(decoded.id);
      }

      if (!account || !account.isActive) {
        return res.status(401).json({ success: false, message: 'Account is inactive or revoked.' });
      }
    }

    req.user = account;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
