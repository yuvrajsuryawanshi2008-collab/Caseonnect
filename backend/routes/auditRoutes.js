const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// GET /api/audit - List audit events
router.get('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.AUDITOR), async (req, res, next) => {
  try {
    const { action, entityType, limit = 50 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const list = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    const formatted = list.map(l => ({
      ...l,
      id: l._id.toString(),
      _id: l._id.toString()
    }));

    res.json({ success: true, count: formatted.length, logs: formatted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
