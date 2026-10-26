const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  userName: { type: String },
  userEmail: { type: String },
  userRole: { type: String },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true },
  ipAddress: { type: String },
  details: { type: String },
  beforeState: { type: mongoose.Schema.Types.Mixed },
  afterState: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
