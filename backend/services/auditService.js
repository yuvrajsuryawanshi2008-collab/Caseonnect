const AuditLog = require('../models/AuditLog');

async function logAuditEvent({ user, action, entityType, entityId, ipAddress, details, beforeState, afterState }) {
  try {
    await AuditLog.create({
      userId: user ? String(user._id || user.id) : 'SYSTEM',
      userName: user ? user.fullName : 'System Automation',
      userEmail: user ? user.email : 'system@caseconnect.internal',
      userRole: user ? user.role : 'SYSTEM',
      action,
      entityType,
      entityId: String(entityId || 'N/A'),
      ipAddress: ipAddress || '127.0.0.1',
      details: details || '',
      beforeState: beforeState || null,
      afterState: afterState || null
    });
  } catch (err) {
    console.error('[Audit Service Error] Failed logging event:', err.message);
  }
}

module.exports = {
  logAuditEvent
};
