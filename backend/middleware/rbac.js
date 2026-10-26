const { ROLES, GENERIC_USER_ROLES, ROLE_PERMISSIONS } = require('../config/constants');

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
        message: `Forbidden: Current role (${req.user.role}) lacks privilege for this action.` 
      });
    }

    next();
  };
}

/**
 * Check a specific permission for generic user portal roles.
 * Usage: requirePermission('canCreateCase')
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Official AICTE roles always pass
    if (!GENERIC_USER_ROLES.includes(req.user.role)) {
      return next();
    }

    const perms = ROLE_PERMISSIONS[req.user.role];
    if (!perms || !perms[permission]) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your user role (${req.user.role}) does not have '${permission}' access.`
      });
    }

    next();
  };
}

/**
 * Check whether a generic user role is allowed (Faculty / Stakeholder / Institution Rep).
 */
function isGenericUser(user) {
  return user && GENERIC_USER_ROLES.includes(user.role);
}

module.exports = {
  authorizeRoles,
  requirePermission,
  isGenericUser
};
