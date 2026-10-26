const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  bureauCode: { type: String, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['OVERLAP_ALERT', 'DEADLINE_WARNING', 'OVERDUE_ALERT', 'CASE_ASSIGNED', 'TRANSFER_REQUEST', 'COORDINATION_NOTE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  linkUrl: { type: String },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
