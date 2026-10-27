const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');

// A random development key keeps local runs usable without a .env file. Production
// must always provide a stable secret so tokens cannot be forged or invalidated silently.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? null
  : crypto.randomBytes(32).toString('hex'));

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set to a strong, stable secret in production.');
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    let account = null;

  const GENERIC_USER_ROLES = ['STUDENT','ROLE_FACULTY','ROLE_STAKEHOLDER','ROLE_INSTITUTION_REP'];

    if (GENERIC_USER_ROLES.includes(decoded.role)) {
      account = await Student.findById(decoded.id);
      if (!account || !account.isActive) {
        return res.status(401).json({ success: false, message: 'User account is inactive or revoked.' });
      }
    } else {
      account = await User.findById(decoded.id);
      if (!account) {
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
