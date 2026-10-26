const express = require('express');
const router = express.Router();
const Bureau = require('../models/Bureau');
const Case = require('../models/Case');
const User = require('../models/User');
const CoordinationRequest = require('../models/CoordinationRequest');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES, CASE_STATUSES } = require('../config/constants');
const { logAuditEvent } = require('../services/auditService');

function formatDoc(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    _id: (obj._id || obj.id)?.toString()
  };
}

// GET /api/bureaus - List bureaus with live case and workload metrics
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const [bureaus, cases, users] = await Promise.all([
      Bureau.find().lean(),
      Case.find().select('bureauCode status slaDeadline').lean(),
      User.find({ isActive: true }).select('bureauId').lean()
    ]);

    const now = new Date();

    const enriched = bureaus.map(b => {
      const bCases = cases.filter(c => c.bureauCode === b.code);
      const openCases = bCases.filter(c => ![CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED].includes(c.status));
      const overdueCases = openCases.filter(c => {
        const deadline = new Date(c.slaDeadline);
        return now > deadline;
      });
      const officers = users.filter(u => u.bureauId === b.code);

      const capacity = b.capacityLimit || 100;
      const saturationPercent = Math.min(100, Math.round((openCases.length / capacity) * 100));

      return {
        ...b,
        id: b._id.toString(),
        totalCases: bCases.length,
        openCases: openCases.length,
        overdueCases: overdueCases.length,
        officerCount: officers.length,
        saturationPercent
      };
    });

    res.json({ success: true, bureaus: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/bureaus/coordination - List cross-bureau coordination dockets
router.get('/coordination', authenticateToken, async (req, res, next) => {
  try {
    const tickets = await CoordinationRequest.find().sort({ createdAt: -1 }).lean();
    const formatted = tickets.map(formatDoc);
    res.json({ success: true, coordinationRequests: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/bureaus/coordination - Initiate joint bureau coordination
router.post('/coordination', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.BUREAU_OFFICER), async (req, res, next) => {
  try {
    const {
      requestingBureauCode,
      targetBureauCode,
      primaryCaseId,
      primaryCaseNumber,
      institutionName,
      subject,
      justification
    } = req.body;

    if (!requestingBureauCode || !targetBureauCode || !primaryCaseId || !subject || !justification) {
      return res.status(400).json({ success: false, message: 'Requesting Bureau, Target Bureau, Primary Case, Subject, and Justification are required.' });
    }

    const created = await CoordinationRequest.create({
      requestingBureauCode,
      targetBureauCode,
      primaryCaseId,
      primaryCaseNumber,
      institutionName: institutionName || 'Institutional Entity',
      subject: subject.trim(),
      justification: justification.trim(),
      status: 'REQUESTED',
      initiatedById: req.user._id,
      initiatedByName: req.user.fullName
    });

    // Notify target bureau
    await Notification.create({
      bureauCode: targetBureauCode,
      title: `Cross-Bureau Coordination Request: ${primaryCaseNumber}`,
      message: `${requestingBureauCode} requested joint coordination concerning ${institutionName}. Subject: ${subject}`,
      type: 'COORDINATION_NOTE',
      caseId: primaryCaseId,
      linkUrl: `/bureaus`
    });

    await logAuditEvent({
      user: req.user,
      action: 'COORDINATION_INITIATED',
      entityType: 'CoordinationRequest',
      entityId: created._id.toString(),
      details: `Initiated cross-bureau coordination between ${requestingBureauCode} and ${targetBureauCode} for case ${primaryCaseNumber}.`
    });

    res.status(201).json({ success: true, message: 'Coordination request dispatched.', coordinationRequest: formatDoc(created) });
  } catch (err) {
    next(err);
  }
});

// POST /api/bureaus/coordination/:id/action - Update coordination docket
router.post('/coordination/:id/action', authenticateToken, async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const request = await CoordinationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Coordination request not found.' });
    }

    if (status) request.status = status;
    if (note) {
      request.jointActionNotes.push({
        author: req.user.fullName,
        bureau: req.user.bureauId || 'Council Cell',
        note: note.trim(),
        createdAt: new Date()
      });
    }

    await request.save();

    res.json({ success: true, message: 'Coordination docket updated.', coordinationRequest: formatDoc(request) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
