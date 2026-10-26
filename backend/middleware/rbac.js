const { ROLES } = require('../config/constants');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next(); // Super admin has global authorization
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Current official role (${req.user.role}) lacks privilege for this action.` 
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
