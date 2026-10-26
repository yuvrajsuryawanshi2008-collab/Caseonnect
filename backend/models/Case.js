const mongoose = require('mongoose');
const { CASE_STATUSES, COMPLAINT_CATEGORIES, SEVERITY_LEVELS, PRIORITY_LEVELS } = require('../config/constants');

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, unique: true, index: true },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  permanentId: { type: String, required: true, index: true },
  institutionName: { type: String, required: true },
  
  bureauId: { type: String, required: true, index: true },
  bureauCode: { type: String, required: true, index: true },
  assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedOfficerName: { type: String },
  
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: COMPLAINT_CATEGORIES, 
    required: true,
    index: true 
  },
  severity: { type: String, enum: SEVERITY_LEVELS, default: 'MEDIUM' },
  priority: { type: String, enum: PRIORITY_LEVELS, default: 'NORMAL' },
  status: { 
    type: String, 
    enum: Object.values(CASE_STATUSES), 
    default: CASE_STATUSES.RECEIVED,
    index: true 
  },
  
  receivedDate: { type: Date, default: Date.now },
  slaDeadline: { type: Date, required: true, index: true },
  lastActionDate: { type: Date, default: Date.now },
  disposedDate: { type: Date },
  
  petitionerType: { type: String, default: 'Student' },
  petitionerName: { type: String },
  petitionerContact: { type: String },
  isConfidential: { type: Boolean, default: false },
  
  nextRequiredAction: { type: String, default: 'Initial Scrutiny & Bureau Review' },
  disposalResolution: { type: String },
  penaltyOrDirective: { type: String },
  
  relatedCaseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Case' }],
  hasPotentialOverlap: { type: Boolean, default: false },
  
  timeline: [{
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    userId: { type: String },
    role: { type: String },
    fromStatus: { type: String },
    toStatus: { type: String },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  
  internalRemarks: [{
    officerName: String,
    role: String,
    comment: String,
    isConfidential: Boolean,
    createdAt: { type: Date, default: Date.now }
  }],

  documents: [{
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadedBy: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
