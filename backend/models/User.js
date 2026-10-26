const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SENIOR_MONITORING_OFFICER', 'BUREAU_OFFICER', 'REGIONAL_REVIEWER', 'AUDITOR', 'INSTITUTION_USER'], 
    default: 'BUREAU_OFFICER' 
  },
  bureauId: { type: String, default: 'RB' },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  designation: { type: String, default: 'Institutional Scrutiny Officer' },
  phoneNumber: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
