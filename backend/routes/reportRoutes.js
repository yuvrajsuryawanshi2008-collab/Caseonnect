const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Institution = require('../models/Institution');
const Bureau = require('../models/Bureau');
const OverlapReview = require('../models/OverlapReview');
const { authenticateToken } = require('../middleware/auth');
const { CASE_STATUSES } = require('../config/constants');
const { calculateAgeing } = require('../services/escalationEngine');

// GET /api/reports/dashboard-stats
router.get('/dashboard-stats', authenticateToken, async (req, res, next) => {
  try {
    const [cases, institutionsCount, bureausCount, pendingOverlapsCount] = await Promise.all([
      Case.find().lean(),
      Institution.countDocuments(),
      Bureau.countDocuments(),
      OverlapReview.countDocuments({ status: 'PENDING_REVIEW' })
    ]);

    const now = new Date();
    let total = cases.length;
    let received = 0;
    let assigned = 0;
    let underProcess = 0;
    let pendingResponse = 0;
    let transferred = 0;
    let escalated = 0;
    let disposed = 0;
    let closed = 0;
    let overdue = 0;

    const bureauCounts = {};
    const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const categoryCounts = {};
    const ageingBrackets = { '0-7 days': 0, '8-15 days': 0, '16-30 days': 0, '>30 days': 0 };

    for (const c of cases) {
      if (c.status === CASE_STATUSES.RECEIVED) received++;
      else if (c.status === CASE_STATUSES.ASSIGNED) assigned++;
      else if (c.status === CASE_STATUSES.UNDER_PROCESS) underProcess++;
      else if (c.status === CASE_STATUSES.PENDING_RESPONSE) pendingResponse++;
      else if (c.status === CASE_STATUSES.TRANSFERRED) transferred++;
      else if (c.status === CASE_STATUSES.ESCALATED) escalated++;
      else if (c.status === CASE_STATUSES.DISPOSED) disposed++;
      else if (c.status === CASE_STATUSES.CLOSED) closed++;

      const isFinished = [CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED].includes(c.status);
      if (!isFinished) {
        const deadline = new Date(c.slaDeadline);
        if (now > deadline) overdue++;
        const ageing = calculateAgeing(c);
        ageingBrackets[ageing.bracket] = (ageingBrackets[ageing.bracket] || 0) + 1;
      }

      const bCode = c.bureauCode;
      bureauCounts[bCode] = (bureauCounts[bCode] || 0) + 1;
      if (severityCounts[c.severity] !== undefined) {
        severityCounts[c.severity]++;
      }
      if (c.category) {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      }
    }

    res.json({
      success: true,
      stats: {
        total,
        received,
        assigned,
        underProcess,
        pendingResponse,
        transferred,
        escalated,
        disposed,
        closed,
        overdue,
        totalInstitutions: institutionsCount,
        totalBureaus: bureausCount,
        pendingOverlaps: pendingOverlapsCount,
        bureauCounts,
        severityCounts,
        categoryCounts,
        ageingBrackets
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/export/cases-csv
router.get('/export/cases-csv', authenticateToken, async (req, res, next) => {
  try {
    const cases = await Case.find().lean();
    
    const headers = [
      'Case Number',
      'Institution Permanent ID',
      'Institution Name',
      'Bureau Code',
      'Category',
      'Severity',
      'Priority',
      'Status',
      'Assigned Officer',
      'Received Date',
      'SLA Deadline',
      'Is Overdue'
    ];

    const rows = cases.map(c => {
      const caseNumber = c.caseNumber || '';
      const permanentId = c.permanentId || '';
      const instName = c.institutionName || '';
      const bCode = c.bureauCode || '';
      const officer = c.assignedOfficerName || 'Unassigned';
      const recDate = c.receivedDate || '';
      const slaDate = c.slaDeadline || '';
      const isOverdue = slaDate && new Date() > new Date(slaDate) && ![CASE_STATUSES.DISPOSED, CASE_STATUSES.CLOSED].includes(c.status);

      return [
        `"${caseNumber}"`,
        `"${permanentId}"`,
        `"${instName.replace(/"/g, '""')}"`,
        `"${bCode}"`,
        `"${(c.category || '').replace(/"/g, '""')}"`,
        `"${c.severity || ''}"`,
        `"${c.priority || ''}"`,
        `"${c.status || ''}"`,
        `"${officer.replace(/"/g, '""')}"`,
        `"${recDate ? new Date(recDate).toISOString().split('T')[0] : ''}"`,
        `"${slaDate ? new Date(slaDate).toISOString().split('T')[0] : ''}"`,
        `"${isOverdue ? 'YES' : 'NO'}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="CaseConnect_Complaints_Report_${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
