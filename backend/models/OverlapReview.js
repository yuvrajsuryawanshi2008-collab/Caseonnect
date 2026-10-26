const mongoose = require('mongoose');

const overlapReviewSchema = new mongoose.Schema({
  caseAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  caseANumber: { type: String, required: true },
  caseATitle: { type: String },
  caseABureau: { type: String },
  caseAOfficer: { type: String },
  
  caseBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  caseBNumber: { type: String, required: true },
  caseBTitle: { type: String },
  caseBBureau: { type: String },
  caseBOfficer: { type: String },
  
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  institutionName: { type: String, required: true },
  permanentId: { type: String, required: true },
  
  confidenceScore: { type: Number, required: true },
  layerMatches: {
    exactIdMatch: { type: Boolean, default: false },
    categoryOverlap: { type: Boolean, default: false },
    timeWindowOverlap: { type: Boolean, default: false },
    textSimilarityScore: { type: Number, default: 0 }
  },
  matchingTokens: [{ type: String }],
  explanation: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING_REVIEW', 'CONFIRMED_RELATED', 'COORDINATION_INITIATED', 'DISMISSED_UNRELATED'], 
    default: 'PENDING_REVIEW',
    index: true 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: { type: String },
  reviewerRole: { type: String },
  reviewerNotes: { type: String },
  reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('OverlapReview', overlapReviewSchema);
