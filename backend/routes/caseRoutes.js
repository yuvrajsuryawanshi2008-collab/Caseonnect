const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Institution = require('../models/Institution');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES, CASE_STATUSES, DEFAULT_SLA_DAYS } = require('../config/constants');
const { transitionCaseStatus } = require('../services/workflowEngine');
const { scanForOverlaps } = require('../services/overlapEngine');
const { calculateAgeing } = require('../services/escalationEngine');
const { logAuditEvent } = require('../services/auditService');

// GET /api/cases - Paginated, filterable case list
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { 
      status, 
      bureauCode, 
      severity, 
      category, 
      institutionId, 
      overdueOnly, 
      query, 
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (bureauCode) filter.bureauCode = bureauCode;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (institutionId) filter.institutionId = institutionId;

    let cases = await Case.find(filter).lean();

    // Text search query across caseNumber, title, institutionName, petitionerName
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      cases = cases.filter(c => 
        (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.institutionName && c.institutionName.toLowerCase().includes(q)) ||
        (c.permanentId && c.permanentId.toLowerCase().includes(q)) ||
        (c.petitionerName && c.petitionerName.toLowerCase().includes(q))
      );
    }

    // Append computed ageing & overdue status
    cases = cases.map(c => {
      const ageing = calculateAgeing(c);
      return {
        ...c,
        ageDays: ageing.ageDays,
        ageBracket: ageing.bracket,
        isOverdue: ageing.isOverdue,
        daysOverdue: ageing.daysOverdue,
        daysRemaining: ageing.daysRemaining
      };
    });

    if (overdueOnly === 'true') {
      cases = cases.filter(c => c.isOverdue);
    }

    // Sort by createdAt descending
    cases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = cases.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = cases.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      cases: paginated
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id - Case details with timeline & relations
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const targetCase = await Case.findById(req.params.id).lean();
    if (!targetCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const ageing = calculateAgeing(targetCase);
    const institution = await Institution.findById(targetCase.institutionId).lean();

    let relatedCases = [];
    if (targetCase.relatedCaseIds && targetCase.relatedCaseIds.length) {
      relatedCases = await Case.find({ _id: { $in: targetCase.relatedCaseIds } }).lean();
    }

    res.json({
      success: true,
      case: {
        ...targetCase,
        ageDays: ageing.ageDays,
        ageBracket: ageing.bracket,
        isOverdue: ageing.isOverdue,
        daysOverdue: ageing.daysOverdue,
        daysRemaining: ageing.daysRemaining
      },
      institution,
      relatedCases
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases - Register new complaint
router.post('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.BUREAU_OFFICER), async (req, res, next) => {
  try {
    const {
      institutionId,
      bureauCode,
      title,
      description,
      category,
      severity = 'MEDIUM',
      priority = 'NORMAL',
      petitionerType = 'Student',
      petitionerName,
      petitionerContact,
      isConfidential = false,
      nextRequiredAction,
      customSlaDays
    } = req.body;

    if (!institutionId || !bureauCode || !title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Institution, Bureau, Title, Description, and Category are required.' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Referenced Institution does not exist.' });
    }

    const slaDays = customSlaDays ? parseInt(customSlaDays, 10) : (DEFAULT_SLA_DAYS[severity] || 30);
    const slaDeadline = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000);

    const count = await Case.countDocuments();
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newCase = await Case.create({
      caseNumber,
      institutionId: String(institution._id),
      permanentId: institution.permanentId,
      institutionName: institution.name,
      bureauId: bureauCode,
      bureauCode,
      assignedOfficerId: req.user._id ? String(req.user._id) : null,
      assignedOfficerName: req.user.fullName,
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      priority,
      status: CASE_STATUSES.RECEIVED,
      slaDeadline,
      petitionerType,
      petitionerName,
      petitionerContact,
      isConfidential: Boolean(isConfidential),
      nextRequiredAction: nextRequiredAction || 'Initial Regulatory Scrutiny',
      timeline: [{
        action: 'Case Registered & Lodged into Institutional System',
        performedBy: req.user.fullName,
        userId: String(req.user._id),
        role: req.user.role,
        fromStatus: 'NONE',
        toStatus: CASE_STATUSES.RECEIVED,
        remarks: 'New complaint formally accepted and registered.',
        timestamp: new Date()
      }]
    });

    await logAuditEvent({
      user: req.user,
      action: 'CASE_REGISTERED',
      entityType: 'Case',
      entityId: String(newCase._id),
      details: `Registered ${caseNumber} concerning ${institution.name} under ${bureauCode}.`
    });

    // Execute Cross-Bureau Overlap scan
    const detectedOverlaps = await scanForOverlaps(newCase);

    res.status(201).json({
      success: true,
      message: 'Case successfully registered.',
      case: newCase,
      detectedOverlapsCount: detectedOverlaps.length
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/status - Authorized status transition
router.post('/:id/status', authenticateToken, async (req, res, next) => {
  try {
    const { targetStatus, remarks } = req.body;
    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'Target status is required.' });
    }

    const updated = await transitionCaseStatus({
      caseId: req.params.id,
      targetStatus,
      user: req.user,
      remarks
    });

    res.json({ success: true, message: `Status updated to ${targetStatus}`, case: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/assign - Assign / reassign officer
router.post('/:id/assign', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.BUREAU_OFFICER), async (req, res, next) => {
  try {
    const { officerId } = req.body;
    const officer = await User.findById(officerId);
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found.' });
    }

    const targetCase = await Case.findById(req.params.id);
    if (!targetCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const previousOfficer = targetCase.assignedOfficerName || 'Unassigned';

    const timelineItem = {
      action: `Assigned to Officer ${officer.fullName}`,
      performedBy: req.user.fullName,
      userId: String(req.user._id),
      role: req.user.role,
      fromStatus: targetCase.status,
      toStatus: targetCase.status === CASE_STATUSES.RECEIVED ? CASE_STATUSES.ASSIGNED : targetCase.status,
      remarks: `Officer assignment changed from ${previousOfficer} to ${officer.fullName} (${officer.designation}).`,
      timestamp: new Date()
    };

    const updateFields = {
      assignedOfficerId: String(officer._id),
      assignedOfficerName: officer.fullName,
      lastActionDate: new Date(),
      $push: { timeline: timelineItem }
    };

    if (targetCase.status === CASE_STATUSES.RECEIVED) {
      updateFields.status = CASE_STATUSES.ASSIGNED;
    }

    const updated = await Case.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    await logAuditEvent({
      user: req.user,
      action: 'CASE_ASSIGNMENT',
      entityType: 'Case',
      entityId: req.params.id,
      details: `Reassigned case ${targetCase.caseNumber} to ${officer.fullName}.`
    });

    res.json({ success: true, message: 'Officer assigned successfully.', case: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/remarks - Append internal remark
router.post('/:id/remarks', authenticateToken, async (req, res, next) => {
  try {
    const { comment, isConfidential = false } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Remark comment text is required.' });
    }

    const remark = {
      officerName: req.user.fullName,
      role: req.user.role,
      comment: comment.trim(),
      isConfidential: Boolean(isConfidential),
      createdAt: new Date()
    };

    const updated = await Case.findByIdAndUpdate(req.params.id, {
      $push: { internalRemarks: remark },
      lastActionDate: new Date()
    }, { new: true });

    res.json({ success: true, message: 'Internal remark recorded.', case: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases/:id/disposal - Formally dispose case
router.post('/:id/disposal', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.BUREAU_OFFICER), async (req, res, next) => {
  try {
    const { resolution, penaltyOrDirective } = req.body;
    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ success: false, message: 'Disposal resolution & justification are required.' });
    }

    const targetCase = await Case.findById(req.params.id);
    if (!targetCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const timelineItem = {
      action: 'Formal Case Disposal Ordered',
      performedBy: req.user.fullName,
      userId: String(req.user._id),
      role: req.user.role,
      fromStatus: targetCase.status,
      toStatus: CASE_STATUSES.DISPOSED,
      remarks: `Resolution: ${resolution.trim()} | Directive: ${penaltyOrDirective || 'Standard Compliance Notice'}`,
      timestamp: new Date()
    };

    const updated = await Case.findByIdAndUpdate(req.params.id, {
      status: CASE_STATUSES.DISPOSED,
      disposalResolution: resolution.trim(),
      penaltyOrDirective: penaltyOrDirective || 'None',
      disposedDate: new Date(),
      lastActionDate: new Date(),
      $push: { timeline: timelineItem }
    }, { new: true });

    await logAuditEvent({
      user: req.user,
      action: 'CASE_DISPOSED',
      entityType: 'Case',
      entityId: req.params.id,
      details: `Case ${targetCase.caseNumber} disposed with order.`
    });

    res.json({ success: true, message: 'Case disposed successfully.', case: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
