const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');
const { ROLES, DEFAULT_SLA_DAYS, COMPLAINT_CATEGORIES, CASE_STATUSES } = require('../config/constants');
const { logAuditEvent } = require('../services/auditService');

// GET /api/config/workflow - Get system configurations
router.get('/workflow', authenticateToken, async (req, res, next) => {
  try {
    const configRow = await SystemConfig.findOne({ key: 'sla_days' }).lean();

    res.json({
      success: true,
      config: {
        slaDays: configRow ? configRow.value : DEFAULT_SLA_DAYS,
        categories: COMPLAINT_CATEGORIES,
        statuses: Object.values(CASE_STATUSES)
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/config/workflow - Update system SLA & workflow configuration
router.put('/workflow', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { slaDays } = req.body;

    if (slaDays) {
      await SystemConfig.findOneAndUpdate(
        { key: 'sla_days' },
        { 
          $set: { 
            value: slaDays,
            description: 'SLA threshold configuration by severity'
          }
        },
        { upsert: true, new: true }
      );
    }

    await logAuditEvent({
      user: req.user,
      action: 'SYSTEM_CONFIG_UPDATED',
      entityType: 'SystemConfig',
      entityId: 'sla_days',
      details: 'Updated SLA rules and threshold parameters.'
    });

    res.json({ success: true, message: 'Workflow settings updated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
