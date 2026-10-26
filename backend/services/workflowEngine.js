const Case = require('../models/Case');
const { ALLOWED_STATUS_TRANSITIONS, CASE_STATUSES } = require('../config/constants');
const { logAuditEvent } = require('./auditService');

/**
 * Validates and transitions case status with full timeline recording.
 */
async function transitionCaseStatus({ caseId, targetStatus, user, remarks }) {
  const targetCase = await Case.findById(caseId);
  if (!targetCase) {
    throw new Error('Case not found');
  }

  const currentStatus = targetCase.status;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    throw new Error(`Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed: ${allowed.join(', ') || 'None'}`);
  }

  // Create timeline record
  const timelineItem = {
    action: `Status transitioned to ${targetStatus}`,
    performedBy: user.fullName || user.email,
    userId: String(user._id || user.id),
    role: user.role,
    fromStatus: currentStatus,
    toStatus: targetStatus,
    remarks: remarks || `Status updated to ${targetStatus}`,
    timestamp: new Date()
  };

  const updateFields = {
    status: targetStatus,
    lastActionDate: new Date(),
    $push: { timeline: timelineItem }
  };

  if (targetStatus === CASE_STATUSES.DISPOSED) {
    updateFields.disposedDate = new Date();
  }

  const updated = await Case.findByIdAndUpdate(caseId, updateFields, { new: true });

  // Immutable audit log
  await logAuditEvent({
    user,
    action: 'CASE_STATUS_TRANSITION',
    entityType: 'Case',
    entityId: String(caseId),
    details: `Transitioned status from ${currentStatus} to ${targetStatus}. Remarks: ${remarks || 'None'}`,
    beforeState: { status: currentStatus },
    afterState: { status: targetStatus }
  });

  return updated;
}

module.exports = {
  transitionCaseStatus
};
