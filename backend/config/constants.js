/**
 * CaseConnect System Constants & Business Invariants
 */

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SENIOR_MONITORING_OFFICER: 'SENIOR_MONITORING_OFFICER',
  BUREAU_OFFICER: 'BUREAU_OFFICER',
  REGIONAL_REVIEWER: 'REGIONAL_REVIEWER',
  AUDITOR: 'AUDITOR',
  STUDENT: 'STUDENT',
  INSTITUTION_USER: 'INSTITUTION_USER',
  // Generic User roles
  ROLE_FACULTY: 'ROLE_FACULTY',
  ROLE_STAKEHOLDER: 'ROLE_STAKEHOLDER',
  ROLE_INSTITUTION_REP: 'ROLE_INSTITUTION_REP'
};

// Maps front-end userType dropdown value → internal role
const USER_TYPE_TO_ROLE = {
  'Student': 'STUDENT',
  'Faculty': 'ROLE_FACULTY',
  'Stakeholder': 'ROLE_STAKEHOLDER',
  'Institution Representative': 'ROLE_INSTITUTION_REP'
};

// All generic user portal roles (used in route guards)
const GENERIC_USER_ROLES = ['STUDENT', 'ROLE_FACULTY', 'ROLE_STAKEHOLDER', 'ROLE_INSTITUTION_REP'];

// Permission matrix for generic user roles
const ROLE_PERMISSIONS = {
  ROLE_FACULTY: {
    canCreateCase: true,
    canViewOwnCases: true,
    canComment: true,
    canViewDashboard: false,
    canManageUsers: false,
    canSubmitFeedback: false
  },
  ROLE_STAKEHOLDER: {
    canCreateCase: false,
    canViewOwnCases: false,
    canComment: false,
    canViewDashboard: true,
    canManageUsers: false,
    canSubmitFeedback: true
  },
  ROLE_INSTITUTION_REP: {
    canCreateCase: true,
    canViewOwnCases: true,
    canComment: true,
    canViewDashboard: false,
    canManageUsers: false,
    canSubmitFeedback: false
  },
  STUDENT: {
    canCreateCase: true,
    canViewOwnCases: true,
    canComment: true,
    canViewDashboard: false,
    canManageUsers: false,
    canSubmitFeedback: false
  }
};

const CASE_STATUSES = {
  RECEIVED: 'RECEIVED',
  ASSIGNED: 'ASSIGNED',
  UNDER_PROCESS: 'UNDER_PROCESS',
  PENDING_RESPONSE: 'PENDING_RESPONSE',
  COORDINATION_REQUESTED: 'COORDINATION_REQUESTED',
  TRANSFERRED: 'TRANSFERRED',
  ESCALATED: 'ESCALATED',
  DISPOSED: 'DISPOSED',
  CLOSED: 'CLOSED'
};

const ALLOWED_STATUS_TRANSITIONS = {
  RECEIVED: ['ASSIGNED', 'DISPOSED'],
  ASSIGNED: ['UNDER_PROCESS', 'TRANSFERRED', 'DISPOSED'],
  UNDER_PROCESS: ['PENDING_RESPONSE', 'COORDINATION_REQUESTED', 'TRANSFERRED', 'ESCALATED', 'DISPOSED'],
  PENDING_RESPONSE: ['UNDER_PROCESS', 'ESCALATED', 'DISPOSED'],
  COORDINATION_REQUESTED: ['UNDER_PROCESS', 'DISPOSED', 'TRANSFERRED'],
  TRANSFERRED: ['ASSIGNED', 'UNDER_PROCESS'],
  ESCALATED: ['UNDER_PROCESS', 'DISPOSED'],
  DISPOSED: ['CLOSED', 'UNDER_PROCESS'], // Can be reopened on valid review
  CLOSED: ['UNDER_PROCESS'] // Super admin review only
};

const COMPLAINT_CATEGORIES = [
  'Faculty & Salary Disputes',
  'Fee Overcharging / Capitation',
  'Withholding Academic Certificates',
  'Infrastructure Deficiencies',
  'Admission & Quota Irregularities',
  'Harassment & Discrimination',
  'Unauthorized / Unapproved Programs',
  'Examination & Evaluation Malpractice',
  'General Administrative Grievance'
];

const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_LEVELS = ['NORMAL', 'URGENT', 'IMMEDIATE'];

const REGIONS = [
  'Northern',
  'North-Western',
  'Central',
  'Western',
  'South-Western',
  'Southern',
  'Eastern'
];

const DEFAULT_SLA_DAYS = {
  CRITICAL: 7,
  HIGH: 15,
  MEDIUM: 30,
  LOW: 45
};

module.exports = {
  ROLES,
  USER_TYPE_TO_ROLE,
  GENERIC_USER_ROLES,
  ROLE_PERMISSIONS,
  CASE_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  COMPLAINT_CATEGORIES,
  SEVERITY_LEVELS,
  PRIORITY_LEVELS,
  REGIONS,
  DEFAULT_SLA_DAYS
};
