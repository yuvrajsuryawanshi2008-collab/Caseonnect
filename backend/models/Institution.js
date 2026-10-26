const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  permanentId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  institutionType: { 
    type: String, 
    enum: ['Government', 'Govt-Aided', 'Unaided-Private', 'University-Dept', 'Deemed-University'], 
    default: 'Unaided-Private' 
  },
  region: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String },
  pincode: { type: String },
  affiliatedUniversity: { type: String },
  approvedIntake: { type: Number, default: 0 },
  contactEmail: { type: String },
  contactPhone: { type: String },
  principalName: { type: String },
  isActive: { type: Boolean, default: true },
  riskScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
