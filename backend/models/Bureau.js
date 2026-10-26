const mongoose = require('mongoose');

const bureauSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  headOfficerName: { type: String },
  contactEmail: { type: String },
  jurisdictionScope: [{ type: String }],
  capacityLimit: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Bureau', bureauSchema);
