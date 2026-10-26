const mongoose = require('mongoose');

const coordinationRequestSchema = new mongoose.Schema({
  requestingBureauCode: { type: String, required: true },
  targetBureauCode: { type: String, required: true },
  primaryCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  primaryCaseNumber: { type: String, required: true },
  associatedCaseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Case' }],
  institutionName: { type: String, required: true },
  subject: { type: String, required: true },
  justification: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['REQUESTED', 'ACCEPTED', 'DECLINED', 'RESOLVED'], 
    default: 'REQUESTED',
    index: true 
  },
  jointActionNotes: [{
    author: String,
    bureau: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
  }],
  initiatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  initiatedByName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CoordinationRequest', coordinationRequestSchema);
