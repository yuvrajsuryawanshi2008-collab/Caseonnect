/**
 * User Auth Extension Tests
 * Tests userType → role mapping, /api/auth/user/register, and /api/auth/user/login
 * for Faculty, Stakeholder, and Institution Representative.
 */

const BASE_URL = 'http://localhost:5000/api';
const { startServer } = require('../backend/server');
let serverInstance = null;

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

const TIMESTAMP = Date.now();

const TEST_USERS = [
  {
    userType: 'Faculty',
    expectedRole: 'ROLE_FACULTY',
    email: `faculty.test.${TIMESTAMP}@caseconnect.gov.in`,
    password: 'Faculty@2026!',
    fullName: 'Prof. Ramesh Kumar',
    college: 'Apex Institute of Technology',
    course: 'B.Tech / B.E.',
    branch: 'Computer Science',
    academicYear: '1st Year (Sem 1-2)'
  },
  {
    userType: 'Stakeholder',
    expectedRole: 'ROLE_STAKEHOLDER',
    email: `stakeholder.test.${TIMESTAMP}@caseconnect.gov.in`,
    password: 'Stake@2026!',
    fullName: 'Dr. Priya Sharma',
    college: 'Apex Institute of Technology',
    course: 'MBA / PGDM',
    branch: 'Management Studies',
    academicYear: 'Postgraduate Year 1'
  },
  {
    userType: 'Institution Representative',
    expectedRole: 'ROLE_INSTITUTION_REP',
    email: `instrep.test.${TIMESTAMP}@caseconnect.gov.in`,
    password: 'InstRep@2026!',
    fullName: 'Ananya Reddy',
    college: 'Apex Institute of Technology',
    course: 'B.Tech / B.E.',
    branch: 'Electronics',
    academicYear: '2nd Year (Sem 3-4)'
  }
];

let passed = 0;
let failed = 0;

function ok(label, cond, detail) {
  if (cond) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label} — ${detail}`);
    failed++;
  }
}

// Unit test: USER_TYPE_TO_ROLE mapping
function testRoleMapping() {
  console.log('\n[1] Unit Test — userType → role mapping');
  const { USER_TYPE_TO_ROLE } = require(require('path').join(__dirname, '../backend/config/constants'));
  ok('Faculty → ROLE_FACULTY', USER_TYPE_TO_ROLE['Faculty'] === 'ROLE_FACULTY', JSON.stringify(USER_TYPE_TO_ROLE));
  ok('Stakeholder → ROLE_STAKEHOLDER', USER_TYPE_TO_ROLE['Stakeholder'] === 'ROLE_STAKEHOLDER', JSON.stringify(USER_TYPE_TO_ROLE));
  ok('Institution Representative → ROLE_INSTITUTION_REP', USER_TYPE_TO_ROLE['Institution Representative'] === 'ROLE_INSTITUTION_REP', JSON.stringify(USER_TYPE_TO_ROLE));
  ok('Unknown type returns undefined', USER_TYPE_TO_ROLE['Unknown'] === undefined, 'should not map unknown types');
}

async function testRegistration() {
  console.log('\n[2] Integration Test — /api/auth/user/register');

  // Invalid userType
  const invalid = await post('/auth/user/register', { userType: 'INVALID', email: 'x@x.com', password: 'Test@123', fullName: 'X', college: 'Y', course: 'Z', branch: 'A', academicYear: 'B', confirmPassword: 'Test@123' });
  ok('Invalid userType → 400', invalid.status === 400, `Got ${invalid.status}: ${invalid.data.message}`);

  // Missing userType
  const missing = await post('/auth/user/register', { email: 'x@x.com', password: 'Test@123', fullName: 'X', college: 'Y', course: 'Z', branch: 'A', academicYear: 'B', confirmPassword: 'Test@123' });
  ok('Missing userType → 400', missing.status === 400, `Got ${missing.status}: ${missing.data.message}`);

  // Register all three user types
  for (const u of TEST_USERS) {
    const r = await post('/auth/user/register', {
      userType: u.userType,
      fullName: u.fullName,
      email: u.email,
      college: u.college,
      course: u.course,
      branch: u.branch,
      academicYear: u.academicYear,
      password: u.password,
      confirmPassword: u.password
    });
    ok(`Register ${u.userType} → 201`, r.status === 201, `Status: ${r.status} ${r.data.message}`);
    ok(`${u.userType} token issued`, typeof r.data.token === 'string' && r.data.token.length > 10, 'No token');
    ok(`${u.userType} role = ${u.expectedRole}`, r.data.user?.role === u.expectedRole || r.data.student?.role === u.expectedRole,
      `Got role: ${r.data.user?.role || r.data.student?.role}`);
    ok(`${u.userType} userType persisted`, r.data.user?.userType === u.userType || r.data.student?.userType === u.userType,
      `Got userType: ${r.data.user?.userType || r.data.student?.userType}`);
    ok(`Password not exposed`, !r.data.user?.passwordHash && !r.data.student?.passwordHash, 'passwordHash exposed!');
  }
}

async function testLogin() {
  console.log('\n[3] Integration Test — /api/auth/user/login');

  for (const u of TEST_USERS) {
    const r = await post('/auth/user/login', { email: u.email, password: u.password });
    ok(`Login ${u.userType} → 200`, r.status === 200, `Status: ${r.status} ${r.data.message}`);
    ok(`${u.userType} login token issued`, typeof r.data.token === 'string' && r.data.token.length > 10, 'No token');
    ok(`${u.userType} login role = ${u.expectedRole}`, r.data.user?.role === u.expectedRole || r.data.student?.role === u.expectedRole,
      `Got: ${r.data.user?.role || r.data.student?.role}`);
  }

  // Wrong password
  const bad = await post('/auth/user/login', { email: TEST_USERS[0].email, password: 'WrongPass123' });
  ok('Wrong password → 401', bad.status === 401, `Got ${bad.status}`);

  // Non-existent user
  const none = await post('/auth/user/login', { email: 'nobody@nobody.com', password: 'Any@1234' });
  ok('Non-existent user → 401', none.status === 401, `Got ${none.status}`);
}

async function testBackwardCompat() {
  console.log('\n[4] Backward Compatibility — /api/auth/student/* still works');
  const r = await post('/auth/student/login', { email: 'student@caseconnect.gov.in', password: 'Student@2026!' });
  ok('Old /student/login still works → 200', r.status === 200, `Status: ${r.status} ${r.data.message}`);
}

(async () => {
  console.log('='.repeat(60));
  console.log('  CaseConnect — User Auth Extension Test Suite');
  console.log('='.repeat(60));

  try {
    try {
      const probe = await fetch('http://localhost:5000/api/health');
      if (probe.status !== 200) throw new Error();
    } catch (e) {
      serverInstance = await startServer();
    }

    testRoleMapping();
    await testRegistration();
    await testLogin();
    await testBackwardCompat();
  } catch (err) {
    console.error('\n[FATAL]', err.message);
    failed++;
  } finally {
    if (serverInstance && typeof serverInstance.close === 'function') {
      serverInstance.close();
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
})();
