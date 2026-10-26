const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Bureau = require('../models/Bureau');
const Institution = require('../models/Institution');
const Case = require('../models/Case');
const { ROLES } = require('../config/constants');
const { scanForOverlaps } = require('../services/overlapEngine');

const DEFAULT_BUREAUS = [
  {
    code: 'RB',
    name: 'Regulation Bureau',
    description: 'Statutory compliance, faculty-student ratios, council norms, show-cause inquiries, and accreditation benchmarks.',
    headOfficerName: 'Dr. S. K. Mukherjee',
    contactEmail: 'regulation@caseconnect.gov.in',
    jurisdictionScope: ['Norms Compliance', 'Faculty Cadre Standards', 'Unapproved Technical Courses'],
    capacityLimit: 120
  },
  {
    code: 'PGRC',
    name: 'Public Grievance Redressal Cell',
    description: 'Resolution of grievances from students, faculty, and stakeholders regarding fee irregularities, certificate withholding, and harassment.',
    headOfficerName: 'Prof. R. Narayanan',
    contactEmail: 'pgrc@caseconnect.gov.in',
    jurisdictionScope: ['Student Grievances', 'Fee Violations', 'Certificate Withholding', 'Harassment'],
    capacityLimit: 150
  },
  {
    code: 'AB',
    name: 'Approval Bureau',
    description: 'Annual extension of approvals (EoA), land and building compliance, program additions, and institutional sanctions.',
    headOfficerName: 'Er. A. K. Verma',
    contactEmail: 'approval@caseconnect.gov.in',
    jurisdictionScope: ['Extension of Approval', 'Infrastructure Compliance', 'Intake Sanctions'],
    capacityLimit: 100
  },
  {
    code: 'PAPB',
    name: 'Policy and Academic Planning Bureau',
    description: 'Curricular guidelines, autonomous college frameworks, faculty development, and educational policies.',
    headOfficerName: 'Dr. Meenakshi Sundaram',
    contactEmail: 'policy@caseconnect.gov.in',
    jurisdictionScope: ['Curricular Norms', 'Autonomy Regulations', 'Academic Standards'],
    capacityLimit: 80
  },
  {
    code: 'VIGILANCE',
    name: 'Chief Vigilance Cell',
    description: 'Special vigilance inquiries, anti-corruption monitoring, whistleblower petitions, and severe institutional malpractices.',
    headOfficerName: 'Shri V. Ramanathan',
    contactEmail: 'vigilance@caseconnect.gov.in',
    jurisdictionScope: ['Financial Fraud', 'Whistleblower Petitions', 'Severe Statutory Violations'],
    capacityLimit: 60
  }
];

async function initializeCoreSystem() {
  try {
    // 1. Initialize Bureaus if not present
    for (const bureau of DEFAULT_BUREAUS) {
      const existing = await Bureau.findOne({ code: bureau.code });
      if (!existing) {
        await Bureau.create(bureau);
      }
    }

    // 2. Initialize Default Accounts for all roles if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[System Init] Creating initial authorized administrator credentials...');
      const salt = await bcrypt.genSalt(10);
      const adminPasswordHash = await bcrypt.hash('Admin@2026!', salt);

      // Super Admin
      await User.create({
        employeeId: 'ADM-001',
        fullName: 'Principal Monitoring Administrator',
        email: 'admin@caseconnect.gov.in',
        passwordHash: adminPasswordHash,
        role: ROLES.SUPER_ADMIN,
        bureauId: 'VIGILANCE',
        designation: 'Senior Regulatory Director',
        phoneNumber: '+91 11 2958 1000',
        isActive: true
      });

      // PGRC Officer
      const officerPasswordHash = await bcrypt.hash('Officer@2026!', salt);
      await User.create({
        employeeId: 'OFF-PGRC-01',
        fullName: 'Officer Ananya Sharma',
        email: 'pgrc.officer@caseconnect.gov.in',
        passwordHash: officerPasswordHash,
        role: ROLES.BUREAU_OFFICER,
        bureauId: 'PGRC',
        designation: 'Grievance Scrutiny Officer',
        phoneNumber: '+91 11 2958 1024',
        isActive: true
      });

      // RB Officer
      await User.create({
        employeeId: 'OFF-RB-01',
        fullName: 'Officer Rajesh Deshmukh',
        email: 'rb.officer@caseconnect.gov.in',
        passwordHash: officerPasswordHash,
        role: ROLES.BUREAU_OFFICER,
        bureauId: 'RB',
        designation: 'Regulation Enforcement Officer',
        phoneNumber: '+91 11 2958 1048',
        isActive: true
      });

      // Regional Reviewer / Overlap Coordinator
      const reviewerPasswordHash = await bcrypt.hash('Reviewer@2026!', salt);
      await User.create({
        employeeId: 'REV-WEST-01',
        fullName: 'Dr. Vikram Malhotra',
        email: 'reviewer@caseconnect.gov.in',
        passwordHash: reviewerPasswordHash,
        role: ROLES.REGIONAL_REVIEWER,
        bureauId: 'PAPB',
        designation: 'Regional Coordination Reviewer',
        phoneNumber: '+91 11 2958 1099',
        isActive: true
      });

      // Institution Profile Representative
      const instPasswordHash = await bcrypt.hash('Institution@2026!', salt);
      await User.create({
        employeeId: 'INST-REP-01',
        fullName: 'Dr. Arvind Joshi (Registrar)',
        email: 'institution@caseconnect.gov.in',
        passwordHash: instPasswordHash,
        role: 'INSTITUTION_USER',
        bureauId: 'RB',
        designation: 'Authorized Institutional Representative',
        phoneNumber: '+91 20 2899 4400',
        isActive: true
      });

      // Demo Student Account
      const studentPasswordHash = await bcrypt.hash('Student@2026!', salt);
      await Student.create({
        fullName: 'Rohan Sharma',
        email: 'student@caseconnect.gov.in',
        passwordHash: studentPasswordHash,
        college: 'Apex Institute of Technology & Engineering',
        course: 'B.Tech',
        branch: 'Computer Science and Engineering',
        academicYear: '3rd Year (Semester 6)',
        studentIdNumber: 'STU-2023-CS-042',
        phoneNumber: '+91 98765 43210',
        role: 'STUDENT',
        isActive: true
      });

      console.log('[System Init] Authorized initial accounts created:');
      console.log('  1. Super Admin:      admin@caseconnect.gov.in        / Admin@2026!');
      console.log('  2. PGRC Officer:     pgrc.officer@caseconnect.gov.in / Officer@2026!');
      console.log('  3. RB Officer:       rb.officer@caseconnect.gov.in   / Officer@2026!');
      console.log('  4. Coordinator/Rev:  reviewer@caseconnect.gov.in     / Reviewer@2026!');
      console.log('  5. Institution Rep:  institution@caseconnect.gov.in  / Institution@2026!');
      console.log('  6. Student Demo:     student@caseconnect.gov.in      / Student@2026!');
    }
  } catch (err) {
    console.error('[System Init Error]', err.message);
  }
}

/**
 * Optional Benchmark Setup: populates verified technical institutions
 * and sample multi-bureau cases to test the Overlap Engine and 360° Profile.
 */
async function loadBenchmarkData() {
  const instCount = await Institution.countDocuments();
  if (instCount > 0) return { message: 'Institutions already initialized.' };

  const inst1 = await Institution.create({
    permanentId: '1-10928371',
    name: 'National Institute of Engineering & Advanced Technology',
    institutionType: 'Unaided-Private',
    region: 'Western',
    state: 'Maharashtra',
    city: 'Pune',
    address: 'Sector 24, Infotech Knowledge Park, Hinjawadi',
    pincode: '411057',
    affiliatedUniversity: 'Savitribai Phule Pune University',
    approvedIntake: 720,
    contactEmail: 'registrar@nieat.edu.in',
    contactPhone: '+91 20 2899 4400',
    principalName: 'Dr. Arvind Joshi',
    riskScore: 45
  });

  const inst2 = await Institution.create({
    permanentId: '1-24810293',
    name: 'Apex Institute of Technology & Management',
    institutionType: 'Unaided-Private',
    region: 'Northern',
    state: 'Uttar Pradesh',
    city: 'Noida',
    address: 'Plot 12, Knowledge Park III, Greater Noida',
    pincode: '201306',
    affiliatedUniversity: 'Dr. A.P.J. Abdul Kalam Technical University',
    approvedIntake: 600,
    contactEmail: 'director@apextech.ac.in',
    contactPhone: '+91 120 4567 890',
    principalName: 'Dr. Sunita Saxena',
    riskScore: 60
  });

  const inst3 = await Institution.create({
    permanentId: '1-33918274',
    name: 'Saraswati College of Engineering and Polytechnic',
    institutionType: 'Govt-Aided',
    region: 'Central',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    address: 'Airport Bypass Road, Gandhi Nagar',
    pincode: '462036',
    affiliatedUniversity: 'Rajiv Gandhi Proudyogiki Vishwavidyalaya',
    approvedIntake: 480,
    contactEmail: 'office@saraswaticollege.ac.in',
    contactPhone: '+91 755 2744 112',
    principalName: 'Prof. K. C. Tiwari',
    riskScore: 10
  });

  // Case 1: Filed at PGRC
  const case1 = await Case.create({
    caseNumber: 'CASE-2026-0001',
    institutionId: String(inst1._id),
    permanentId: inst1.permanentId,
    institutionName: inst1.name,
    bureauId: 'PGRC',
    bureauCode: 'PGRC',
    assignedOfficerName: 'Officer Ananya Sharma',
    title: 'Arbitrary withholding of original degree certificates and delayed faculty salary payments',
    description: 'Multiple faculty members and graduating students allege that the college management is refusing to release original degree marksheets and delaying 6th pay commission salary arrears for over 5 months.',
    category: 'Faculty & Salary Disputes',
    severity: 'HIGH',
    priority: 'URGENT',
    status: 'UNDER_PROCESS',
    receivedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    slaDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    petitionerType: 'Faculty',
    petitionerName: 'Dr. Amit Trivedi & Staff Delegation',
    nextRequiredAction: 'Issue formal notice to College Chairman for explanation',
    timeline: [{
      action: 'Case Registered',
      performedBy: 'Officer Ananya Sharma',
      role: 'BUREAU_OFFICER',
      fromStatus: 'NONE',
      toStatus: 'RECEIVED',
      remarks: 'Lodged into PGRC intake queue.',
      timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
    }, {
      action: 'Preliminary Scrutiny Initiated',
      performedBy: 'Officer Ananya Sharma',
      role: 'BUREAU_OFFICER',
      fromStatus: 'RECEIVED',
      toStatus: 'UNDER_PROCESS',
      remarks: 'Evidence submitted by faculty scrutinized.',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }]
  });

  // Case 2: Filed at RB
  const case2 = await Case.create({
    caseNumber: 'CASE-2026-0002',
    institutionId: String(inst1._id),
    permanentId: inst1.permanentId,
    institutionName: inst1.name,
    bureauId: 'RB',
    bureauCode: 'RB',
    assignedOfficerName: 'Officer Rajesh Deshmukh',
    title: 'Severe faculty cadre ratio deficiency and non-payment of UGC/Council prescribed pay scale salaries',
    description: 'Vigilance tip-off received alleging that National Institute of Engineering is operating with 40% faculty vacancy, employing unqualified ad-hoc staff, and holding back staff salary payments contrary to council norms.',
    category: 'Faculty & Salary Disputes',
    severity: 'CRITICAL',
    priority: 'IMMEDIATE',
    status: 'UNDER_PROCESS',
    receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    petitionerType: 'Public / Whistleblower',
    petitionerName: 'Confidential Whistleblower',
    nextRequiredAction: 'Scrutinize biometric attendance & bank payroll records',
    timeline: [{
      action: 'Case Registered',
      performedBy: 'Officer Rajesh Deshmukh',
      role: 'BUREAU_OFFICER',
      fromStatus: 'NONE',
      toStatus: 'RECEIVED',
      remarks: 'Registered under Regulation Bureau statutory docket.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }, {
      action: 'Moved to Under Process',
      performedBy: 'Officer Rajesh Deshmukh',
      role: 'BUREAU_OFFICER',
      fromStatus: 'RECEIVED',
      toStatus: 'UNDER_PROCESS',
      remarks: 'Audit team requested payroll evidence.',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    }]
  });

  // Run overlap detection
  await scanForOverlaps(case2);

  // Case 3: Overdue case at Apex Institute
  await Case.create({
    caseNumber: 'CASE-2026-0003',
    institutionId: String(inst2._id),
    permanentId: inst2.permanentId,
    institutionName: inst2.name,
    bureauId: 'AB',
    bureauCode: 'AB',
    assignedOfficerName: 'Er. A. K. Verma',
    title: 'Unauthorized construction of laboratory block on non-contiguous land without Council approval',
    description: 'Field inspection reported that Apex Institute has expanded intake in Computer Engineering while shifting computer labs to an unapproved leased building 4 km away.',
    category: 'Infrastructure Deficiencies',
    severity: 'CRITICAL',
    priority: 'IMMEDIATE',
    status: 'PENDING_RESPONSE',
    receivedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    slaDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // OVERDUE
    petitionerType: 'Student',
    petitionerName: 'Student Union Representatives',
    nextRequiredAction: 'Issue final show-cause notice prior to intake reduction',
    timeline: [{
      action: 'Show Cause Notice Issued',
      performedBy: 'Er. A. K. Verma',
      role: 'BUREAU_OFFICER',
      fromStatus: 'UNDER_PROCESS',
      toStatus: 'PENDING_RESPONSE',
      remarks: 'Show cause notice dispatched with 15-day deadline. College response pending.',
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    }]
  });

  return { message: 'Benchmark regulatory records initialized successfully.' };
}

module.exports = {
  initializeCoreSystem,
  loadBenchmarkData
};
