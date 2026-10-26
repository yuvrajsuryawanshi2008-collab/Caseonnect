const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');
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

// =========================================================================
// STUDENT AUTHENTICATION & REGISTRATION ENDPOINTS
// =========================================================================

// POST /api/auth/student/register - Register a new student account
router.post('/student/register', async (req, res, next) => {
  try {
    const { 
      fullName, 
      email, 
      college, 
      course, 
      branch, 
      academicYear, 
      studentIdNumber, 
      phoneNumber, 
      password, 
      confirmPassword 
    } = req.body;

    // 1. Required fields presence check
    if (!fullName || !email || !college || !course || !branch || !academicYear || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, College, Course, Branch, Academic Year, and Password are all required.'
      });
    }

    // 2. Validate full name length
    if (fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full Name must be at least 2 characters long.'
      });
    }

    // 3. Email format validation
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid student email address.'
      });
    }

    // 4. Password confirmation check
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and password confirmation do not match.'
      });
    }

    // 5. Password complexity requirement (min 8 chars, letter + number)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain both letters and at least one number.'
      });
    }

    // 6. Duplicate account prevention (Enforce unique email across both Student and User collections)
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'A student account with this email address already exists. Please sign in.'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists in the system.'
      });
    }

    // 7. Secure Password Hashing
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 8. Create Student Profile in MongoDB
    const newStudent = await Student.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      college: college.trim(),
      course: course.trim(),
      branch: branch.trim(),
      academicYear: academicYear.trim(),
      studentIdNumber: studentIdNumber ? studentIdNumber.trim() : '',
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      role: 'STUDENT',
      isActive: true,
      lastLogin: new Date()
    });

    // 9. Generate Authentication JWT Session Token
    const token = jwt.sign(
      { 
        id: newStudent._id, 
        role: 'STUDENT', 
        email: newStudent.email, 
        fullName: newStudent.fullName 
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // 10. Audit Trail Logging
    try {
      await logAuditEvent({
        user: { fullName: newStudent.fullName, role: 'STUDENT' },
        action: 'STUDENT_REGISTERED',
        entityType: 'Student',
        entityId: String(newStudent._id),
        ipAddress: req.ip,
        details: `Student ${newStudent.fullName} registered under institution ${newStudent.college}.`
      });
    } catch (auditErr) {
      console.warn('[Audit Warning] Could not record student registration:', auditErr.message);
    }

    const safeStudent = newStudent.toObject ? newStudent.toObject() : { ...newStudent };
    delete safeStudent.passwordHash;

    res.status(201).json({
      success: true,
      message: 'Student registration completed successfully.',
      token,
      student: safeStudent,
      user: safeStudent
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A student account with this email address already exists.'
      });
    }
    next(err);
  }
});

// POST /api/auth/student/login - Student authentication
router.post('/student/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Student email and password credentials are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const student = await Student.findOne({ email: normalizedEmail });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student credentials.'
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This student account has been deactivated. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student credentials.'
      });
    }

    // Update last login timestamp
    await Student.findByIdAndUpdate(student._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { 
        id: student._id, 
        role: 'STUDENT', 
        email: student.email, 
        fullName: student.fullName 
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    try {
      await logAuditEvent({
        user: { fullName: student.fullName, role: 'STUDENT' },
        action: 'STUDENT_LOGIN',
        entityType: 'Student',
        entityId: String(student._id),
        ipAddress: req.ip,
        details: `Student ${student.fullName} logged into Student Portal.`
      });
    } catch (auditErr) {
      console.warn('[Audit Warning] Could not record student login:', auditErr.message);
    }

    const safeStudent = student.toObject ? student.toObject() : { ...student };
    delete safeStudent.passwordHash;

    res.json({
      success: true,
      message: 'Student authentication verified.',
      token,
      student: safeStudent,
      user: safeStudent
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/student/profile - Authenticated Student profile retrieval
router.get('/student/profile', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to student accounts.'
      });
    }

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile record not found.'
      });
    }

    const safeStudent = student.toObject ? student.toObject() : { ...student };
    delete safeStudent.passwordHash;

    res.json({
      success: true,
      student: safeStudent,
      user: safeStudent
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/student/profile - Authenticated Student profile update
router.put('/student/profile', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to student accounts.'
      });
    }

    const { college, course, branch, academicYear, phoneNumber, studentIdNumber } = req.body;

    const updates = {};
    if (college) updates.college = college.trim();
    if (course) updates.course = course.trim();
    if (branch) updates.branch = branch.trim();
    if (academicYear) updates.academicYear = academicYear.trim();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
    if (studentIdNumber !== undefined) updates.studentIdNumber = studentIdNumber.trim();

    const updated = await Student.findByIdAndUpdate(req.user._id, updates, { new: true });
    const safeStudent = updated.toObject ? updated.toObject() : { ...updated };
    delete safeStudent.passwordHash;

    res.json({
      success: true,
      message: 'Student profile updated successfully.',
      student: safeStudent,
      user: safeStudent
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students - Authorized regulatory review of registered students
router.get('/admin/students', authenticateToken, authorizeRoles(
  ROLES.SUPER_ADMIN, 
  ROLES.SENIOR_MONITORING_OFFICER, 
  ROLES.BUREAU_OFFICER, 
  ROLES.REGIONAL_REVIEWER
), async (req, res, next) => {
  try {
    const { query, college, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { studentIdNumber: { $regex: query, $options: 'i' } }
      ];
    }

    if (college) {
      filter.college = { $regex: college, $options: 'i' };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      students
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
