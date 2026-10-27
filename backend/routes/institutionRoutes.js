const express = require('express');
const router = express.Router();
const Institution = require('../models/Institution');
const Case = require('../models/Case');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES, CASE_STATUSES } = require('../config/constants');
const { logAuditEvent } = require('../services/auditService');

function formatInstitution(i) {
  if (!i) return null;
  const obj = typeof i.toObject === 'function' ? i.toObject() : { ...i };
  return {
    ...obj,
    id: (obj._id || obj.id)?.toString(),
    _id: (obj._id || obj.id)?.toString()
  };
}

// GET /api/institutions - Search institutions
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { query, region, institutionType } = req.query;

    const filter = {};
    if (region) filter.region = region;
    if (institutionType) filter.institutionType = institutionType;

    if (query && query.trim()) {
      const q = query.trim();
      // The PostgreSQL adapter supports parameterized $regex filters. Passing a
      // JavaScript RegExp here is not serializable to SQL and breaks search.
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { permanentId: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } }
      ];
    }

    const institutions = await Institution.find(filter).lean();
    const allCases = await Case.find().select('institutionId permanentId status severity').lean();

    const enriched = institutions.map(inst => {
      const instIdStr = inst._id.toString();
      const instCases = allCases.filter(c => 
        (c.institutionId && c.institutionId.toString() === instIdStr) || 
        (c.permanentId && c.permanentId === inst.permanentId)
      );
      const openCases = instCases.filter(c => ![CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED].includes(c.status));
      const criticalCases = openCases.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH');
      const riskScore = Math.min(100, (openCases.length * 15) + (criticalCases.length * 20));

      return {
        ...inst,
        id: instIdStr,
        totalCases: instCases.length,
        openCases: openCases.length,
        criticalCases: criticalCases.length,
        riskScore
      };
    });

    res.json({ success: true, count: enriched.length, institutions: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/institutions/:id - Single institution
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    let inst = null;
    const isIdFormat = /^[0-9a-fA-F-]{24,36}$/.test(req.params.id);
    if (isIdFormat) {
      inst = await Institution.findById(req.params.id);
    }
    if (!inst) {
      inst = await Institution.findOne({ permanentId: req.params.id });
    }

    if (!inst) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }
    res.json({ success: true, institution: formatInstitution(inst) });
  } catch (err) {
    next(err);
  }
});

// GET /api/institutions/:id/profile-360 - 360° Consolidated Dossier
router.get('/:id/profile-360', authenticateToken, async (req, res, next) => {
  try {
    let institution = null;
    const isIdFormat = /^[0-9a-fA-F-]{24,36}$/.test(req.params.id);
    if (isIdFormat) {
      institution = await Institution.findById(req.params.id);
    }
    if (!institution) {
      institution = await Institution.findOne({ permanentId: req.params.id });
    }

    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    const instIdStr = institution._id.toString();
    const cases = await Case.find({
      $or: [
        { institutionId: institution._id },
        { permanentId: institution.permanentId }
      ]
    }).sort({ createdAt: -1 }).lean();

    const bureauBreakdown = {};
    const statusBreakdown = {};
    const categoryBreakdown = {};
    let openCount = 0;
    let overdueCount = 0;
    let criticalCount = 0;
    const now = new Date();

    for (const c of cases) {
      const bCode = c.bureauCode;
      bureauBreakdown[bCode] = (bureauBreakdown[bCode] || 0) + 1;
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;

      const isClosed = [CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED].includes(c.status);
      if (!isClosed) {
        openCount++;
        if (c.severity === 'CRITICAL' || c.severity === 'HIGH') criticalCount++;
        const deadline = new Date(c.slaDeadline);
        if (now > deadline) overdueCount++;
      }
    }

    let riskLevel = 'LOW';
    const computedRisk = Math.min(100, (openCount * 12) + (criticalCount * 25) + (overdueCount * 20));
    if (computedRisk >= 70) riskLevel = 'CRITICAL / WATCHLIST';
    else if (computedRisk >= 40) riskLevel = 'ELEVATED INQUIRY';
    else if (computedRisk > 0) riskLevel = 'ROUTINE SCRUTINY';

    res.json({
      success: true,
      institution: {
        ...formatInstitution(institution),
        riskScore: computedRisk,
        riskLevel
      },
      metrics: {
        totalCases: cases.length,
        openCases: openCount,
        overdueCases: overdueCount,
        criticalCases: criticalCount,
        bureauBreakdown,
        statusBreakdown,
        categoryBreakdown
      },
      cases: cases.map(c => ({ ...c, id: c._id.toString() }))
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions - Create institution
router.post('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER, ROLES.REGIONAL_REVIEWER), async (req, res, next) => {
  try {
    const {
      permanentId,
      name,
      institutionType = 'Unaided-Private',
      region,
      state,
      city,
      address,
      pincode,
      affiliatedUniversity,
      approvedIntake = 0,
      contactEmail,
      contactPhone,
      principalName
    } = req.body;

    if (!permanentId || !name || !region || !state || !city) {
      return res.status(400).json({ success: false, message: 'Permanent ID, Name, Region, State, and City are required.' });
    }

    const existing = await Institution.findOne({ permanentId: permanentId.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `An institution with Permanent ID ${permanentId} already exists.` });
    }

    const created = await Institution.create({
      permanentId: permanentId.trim(),
      name: name.trim(),
      institutionType,
      region,
      state,
      city,
      address,
      pincode,
      affiliatedUniversity,
      approvedIntake: Number(approvedIntake) || 0,
      contactEmail,
      contactPhone,
      principalName
    });

    await logAuditEvent({
      user: req.user,
      action: 'INSTITUTION_REGISTERED',
      entityType: 'Institution',
      entityId: created._id.toString(),
      details: `Registered institution ${name} (ID: ${permanentId}).`
    });

    res.status(201).json({ success: true, message: 'Institution created successfully.', institution: formatInstitution(created) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/institutions/:id - Update institution
router.put('/:id', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.SENIOR_MONITORING_OFFICER), async (req, res, next) => {
  try {
    const updated = await Institution.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    await logAuditEvent({
      user: req.user,
      action: 'INSTITUTION_UPDATED',
      entityType: 'Institution',
      entityId: req.params.id,
      details: `Updated metadata for institution.`
    });

    res.json({ success: true, message: 'Institution updated.', institution: formatInstitution(updated) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
