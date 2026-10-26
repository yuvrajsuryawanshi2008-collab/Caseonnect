/**
 * CaseConnect Demo Accounts & Benchmark Provisioning Script
 * Populates verified demo accounts for all roles and seeds benchmark records into MongoDB.
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Bureau = require('../models/Bureau');
const { ROLES } = require('../config/constants');
const { initializeCoreSystem, loadBenchmarkData } = require('../utils/seedData');

const DEMO_ACCOUNTS = [
  {
    employeeId: 'ADM-001',
    fullName: 'Principal Monitoring Administrator',
    email: 'admin@caseconnect.gov.in',
    password: 'Admin@2026!',
    role: ROLES.SUPER_ADMIN,
    bureauId: 'VIGILANCE',
    designation: 'Senior Regulatory Director',
    phoneNumber: '+91 11 2958 1000'
  },
  {
    employeeId: 'OFF-PGRC-01',
    fullName: 'Officer Ananya Sharma',
    email: 'pgrc.officer@caseconnect.gov.in',
    password: 'Officer@2026!',
    role: ROLES.BUREAU_OFFICER,
    bureauId: 'PGRC',
    designation: 'Grievance Scrutiny Officer',
    phoneNumber: '+91 11 2958 1024'
  },
  {
    employeeId: 'OFF-RB-01',
    fullName: 'Officer Rajesh Deshmukh',
    email: 'rb.officer@caseconnect.gov.in',
    password: 'Officer@2026!',
    role: ROLES.BUREAU_OFFICER,
    bureauId: 'RB',
    designation: 'Regulation Enforcement Officer',
    phoneNumber: '+91 11 2958 1048'
  },
  {
    employeeId: 'REV-WEST-01',
    fullName: 'Dr. Vikram Malhotra',
    email: 'reviewer@caseconnect.gov.in',
    password: 'Reviewer@2026!',
    role: ROLES.REGIONAL_REVIEWER,
    bureauId: 'PAPB',
    designation: 'Regional Coordination Reviewer',
    phoneNumber: '+91 11 2958 1099'
  },
  {
    employeeId: 'INST-REP-01',
    fullName: 'Dr. Arvind Joshi (Registrar)',
    email: 'institution@caseconnect.gov.in',
    password: 'Institution@2026!',
    role: 'INSTITUTION_USER',
    bureauId: 'RB',
    designation: 'Authorized Institutional Representative',
    phoneNumber: '+91 20 2899 4400'
  }
];

async function run() {
  console.log('===============================================================');
  console.log(' CaseConnect — MongoDB Demo Accounts & Benchmark Provisioner');
  console.log('===============================================================\n');

  try {
    await connectDB();
    console.log('[1/3] Initializing Core System Schemas...');
    await initializeCoreSystem();

    console.log('\n[2/3] Provisioning and synchronizing Demo Accounts...');
    const salt = await bcrypt.genSalt(10);

    for (const acc of DEMO_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(acc.password, salt);
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        existing.fullName = acc.fullName;
        existing.employeeId = acc.employeeId;
        existing.role = acc.role;
        existing.bureauId = acc.bureauId;
        existing.designation = acc.designation;
        existing.phoneNumber = acc.phoneNumber;
        existing.passwordHash = passwordHash;
        existing.isActive = true;
        await existing.save();
        console.log(`  - Synced existing demo account: ${acc.email} (${acc.role})`);
      } else {
        await User.create({
          employeeId: acc.employeeId,
          fullName: acc.fullName,
          email: acc.email,
          passwordHash,
          role: acc.role,
          bureauId: acc.bureauId,
          designation: acc.designation,
          phoneNumber: acc.phoneNumber,
          isActive: true
        });
        console.log(`  - Created demo account: ${acc.email} (${acc.role})`);
      }
    }

    console.log('\n[3/3] Loading Benchmark Regulatory Records & Overlap Scan...');
    const benchmarkResult = await loadBenchmarkData();
    console.log(`[Result] ${benchmarkResult.message}`);

    console.log('\n===============================================================');
    console.log(' Setup Complete! The following accounts are active in MongoDB:');
    console.log('---------------------------------------------------------------');
    console.log(' 1. Super Admin:      admin@caseconnect.gov.in        / Admin@2026!');
    console.log(' 2. PGRC Officer:     pgrc.officer@caseconnect.gov.in / Officer@2026!');
    console.log(' 3. RB Officer:       rb.officer@caseconnect.gov.in   / Officer@2026!');
    console.log(' 4. Coordinator/Rev:  reviewer@caseconnect.gov.in     / Reviewer@2026!');
    console.log(' 5. Institution Rep:  institution@caseconnect.gov.in  / Institution@2026!');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Provisioning failed:', err.message);
    process.exit(1);
  }
}

run();
