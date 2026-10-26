const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');
const { logAuditEvent } = require('../services/auditService');

function formatUser(u) {
  if (!u) return null;
  const obj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  delete obj.passwordHash;
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    _id: (obj._id || obj.id)?.toString()
  };
}

// GET /api/users - List users
router.get('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER), async (req, res, next) => {
  try {
    const rawUsers = await User.find().select('-passwordHash').lean();
    const sanitized = rawUsers.map(formatUser);
    res.json({ success: true, users: sanitized });
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create official
router.post('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { employeeId, fullName, email, password, role, bureauId, designation, phoneNumber, institutionId } = req.body;
    if (!employeeId || !fullName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Employee ID, Full Name, Email, Password, and Role are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An official account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const created = await User.create({
      employeeId: employeeId.trim(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      bureauId: bureauId || 'RB',
      institutionId: institutionId || null,
      designation: designation || 'Institutional Scrutiny Officer',
      phoneNumber,
      isActive: true
    });

    await logAuditEvent({
      user: req.user,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: created._id.toString(),
      details: `Created user ${fullName} (${role}) for bureau ${bureauId}.`
    });

    res.status(201).json({ success: true, message: 'User created successfully.', user: formatUser(created) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/toggle-status - Activate / deactivate
router.put('/:id/toggle-status', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAuditEvent({
      user: req.user,
      action: 'USER_STATUS_TOGGLED',
      entityType: 'User',
      entityId: req.params.id,
      details: `Account for ${user.fullName} toggled to ${user.isActive ? 'ACTIVE' : 'INACTIVE'}.`
    });

    res.json({ success: true, message: `Account is now ${user.isActive ? 'Active' : 'Inactive'}.`, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
