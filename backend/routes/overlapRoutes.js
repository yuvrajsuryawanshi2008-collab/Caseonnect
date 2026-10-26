const express = require('express');
const router = express.Router();
const OverlapReview = require('../models/OverlapReview');
const Case = require('../models/Case');
const CoordinationRequest = require('../models/CoordinationRequest');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');
const { scanForOverlaps } = require('../services/overlapEngine');
const { logAuditEvent } = require('../services/auditService');

function formatDoc(o) {
  if (!o) return null;
  const obj = typeof o.toObject === 'function' ? o.toObject() : { ...o };
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    _id: (obj._id || obj.id)?.toString()
  };
}

// GET /api/overlaps - List overlap reviews
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, bureauCode } = req.query;

    const query = {};
    if (status) query.status = status;
    if (bureauCode) {
      query.$or = [{ caseABureau: bureauCode }, { caseBBureau: bureauCode }];
    }

    const list = await OverlapReview.find(query).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      count: list.length,
      overlaps: list.map(formatDoc)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/overlaps/check/:caseId - Trigger on-demand overlap scan for a case
router.get('/check/:caseId', authenticateToken, async (req, res, next) => {
  try {
    const targetCase = await Case.findById(req.params.caseId);

    if (!targetCase) {
      return res.status(404).json({ success: false, message: 'Target case not found.' });
    }

    const detected = await scanForOverlaps(targetCase);
    res.json({ success: true, count: detected.length, overlaps: detected.map(formatDoc) });
  } catch (err) {
    next(err);
  }
});

// POST /api/overlaps/:id/review - Record human review determination
router.post('/:id/review', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.BUREAU_OFFICER, ROLES.REGIONAL_REVIEWER), async (req, res, next) => {
  try {
    const { determination, reviewerNotes } = req.body;
    if (!['CONFIRMED_RELATED', 'COORDINATION_INITIATED', 'DISMISSED_UNRELATED'].includes(determination)) {
      return res.status(400).json({ success: false, message: 'Invalid review determination.' });
    }

    const review = await OverlapReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Overlap review record not found.' });
    }

    review.status = determination;
    review.reviewedBy = req.user._id;
    review.reviewerName = req.user.fullName;
    review.reviewerRole = req.user.role;
    review.reviewerNotes = reviewerNotes || 'Review completed by authorized official.';
    review.reviewedAt = new Date();

    await review.save();

    // If confirmed related, update case relationship cross-references
    if (determination === 'CONFIRMED_RELATED') {
      await Promise.all([
        Case.findByIdAndUpdate(review.caseAId, { $addToSet: { relatedCaseIds: review.caseBId } }),
        Case.findByIdAndUpdate(review.caseBId, { $addToSet: { relatedCaseIds: review.caseAId } })
      ]);
    } else if (determination === 'COORDINATION_INITIATED') {
      await CoordinationRequest.create({
        requestingBureauCode: review.caseABureau,
        targetBureauCode: review.caseBBureau,
        primaryCaseId: review.caseAId,
        primaryCaseNumber: review.caseANumber,
        associatedCaseIds: [review.caseBId],
        institutionName: review.institutionName,
        subject: `Joint Cross-Bureau Inquiry: ${review.caseANumber} & ${review.caseBNumber}`,
        justification: `Overlap review identified related allegations: ${reviewerNotes || review.explanation}`,
        status: 'REQUESTED',
        initiatedById: req.user._id,
        initiatedByName: req.user.fullName
      });
    }

    await logAuditEvent({
      user: req.user,
      action: 'OVERLAP_DETERMINATION_LOGGED',
      entityType: 'OverlapReview',
      entityId: req.params.id,
      details: `Determination: ${determination} on match between ${review.caseANumber} and ${review.caseBNumber}. Notes: ${reviewerNotes || 'None'}`
    });

    res.json({ success: true, message: 'Overlap review decision recorded.', overlap: formatDoc(review) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
