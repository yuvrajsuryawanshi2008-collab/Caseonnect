const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password credentials are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid official credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This official account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid official credentials.' });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { id: user._id, role: user.role, bureauId: user.bureauId, institutionId: user.institutionId },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logAuditEvent({
      user,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: String(user._id),
      ipAddress: req.ip,
      details: `Official ${user.fullName} logged into CaseConnect console.`
    });

    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.passwordHash;

    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register - Register new official account
router.post('/register', async (req, res, next) => {
  try {
    const { employeeId, fullName, email, password, bureauId, designation, phoneNumber, institutionId } = req.body;

    if (!employeeId || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Full Name, Email, and Password are all required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid official email address.'
      });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An official account with this email address already exists.'
      });
    }

    const existingEmpId = await User.findOne({ employeeId: employeeId.trim() });
    if (existingEmpId) {
      return res.status(409).json({
        success: false,
        message: 'An official account with this Employee ID already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      employeeId: employeeId.trim(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'BUREAU_OFFICER',
      bureauId: bureauId || 'RB',
      institutionId: institutionId || null,
      designation: designation || 'Institutional Scrutiny Officer',
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      isActive: true,
      lastLogin: new Date()
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, bureauId: newUser.bureauId },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logAuditEvent({
      user: newUser,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: String(newUser._id),
      ipAddress: req.ip,
      details: `New official registered: ${newUser.fullName} (${newUser.employeeId}) assigned to bureau ${newUser.bureauId}.`
    });

    const safeUser = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete safeUser.passwordHash;

    res.status(201).json({
      success: true,
      message: 'Official account registered successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const safeUser = req.user.toObject ? req.user.toObject() : { ...req.user };
  delete safeUser.passwordHash;
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id, { passwordHash });

    await logAuditEvent({
      user: req.user,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: String(user._id),
      ipAddress: req.ip,
      details: 'Official updated their authentication credentials.'
    });

    res.json({ success: true, message: 'Password successfully updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
