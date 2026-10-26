const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    index: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  college: {
    type: String,
    required: [true, 'College / Institution name is required'],
    trim: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  course: {
    type: String,
    required: [true, 'Course is required (e.g., B.Tech, MCA, MBA)'],
    trim: true
  },
  branch: {
    type: String,
    required: [true, 'Branch / Department is required'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year / Semester is required'],
    trim: true
  },
  studentIdNumber: {
    type: String,
    trim: true,
    default: ''
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['STUDENT', 'ROLE_FACULTY', 'ROLE_STAKEHOLDER', 'ROLE_INSTITUTION_REP'],
    default: 'STUDENT'
  },
  userType: {
    type: String,
    enum: ['Institution Representative', 'Faculty', 'Stakeholder', ''],
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
