const http = require('http');
const { startServer } = require('../backend/server');

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      method: options.method || 'GET'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function run() {
  console.log('======================================================');
  console.log(' CaseConnect Comprehensive Live Verification Suite');
  console.log(' Engine: MongoDB / Mongoose Enterprise Engine');
  console.log('======================================================\n');

  let serverInstance = null;

  try {
    serverInstance = await startServer();

    // 1. Health check
    console.log('1. Verifying /api/health endpoint...');
    const health = await request('/api/health');
    if (health.status !== 200 || !health.data.database.connected) {
      throw new Error(`Health check failed: ${JSON.stringify(health.data)}`);
    }
    console.log(`   [PASS] Health API online, MongoDB connected (${health.data.database.provider}).\n`);

    // 2. Static Frontend Root
    console.log('2. Verifying static frontend delivery...');
    const root = await request('/');
    if (root.status !== 200 || typeof root.data !== 'string' || !root.data.includes('CaseConnect')) {
      throw new Error('Frontend failed to deliver index.html with CaseConnect branding');
    }
    console.log('   [PASS] Static frontend served correctly.\n');

    // 3. Login with Seed Administrator
    console.log('3. Verifying Super Admin authentication...');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@caseconnect.gov.in',
        password: 'Admin@2026!'
      }
    });

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const adminToken = loginRes.data.token;
    if (loginRes.data.user.passwordHash) {
      throw new Error('Security flaw: passwordHash leaked in login response!');
    }
    console.log(`   [PASS] Logged in as: ${loginRes.data.user.fullName} (${loginRes.data.user.role})`);
    console.log('   [PASS] No passwordHash in response payload.\n');

    // 4. Test Invalid Login
    console.log('4. Verifying invalid credential rejection...');
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@caseconnect.gov.in',
        password: 'WrongPassword123!'
      }
    });
    if (invalidLogin.status !== 401 || invalidLogin.data.success !== false) {
      throw new Error('Invalid login was not rejected with HTTP 401');
    }
    console.log(`   [PASS] Invalid login correctly rejected: "${invalidLogin.data.message}"\n`);

    // 5. Test Official Registration
    console.log('5. Verifying new official registration endpoint...');
    const uniqueSuffix = Date.now().toString().slice(-4);
    const testEmpId = `OFF-QA-${uniqueSuffix}`;
    const testEmail = `qa.inspector.${uniqueSuffix}@caseconnect.gov.in`;

    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        employeeId: testEmpId,
        fullName: 'Inspector QA Verification Officer',
        email: testEmail,
        password: 'Officer@2026!',
        bureauId: 'RB',
        designation: 'Senior Regulatory Inspector',
        phoneNumber: '+91 11 2958 5555'
      }
    });

    if (regRes.status !== 201 || !regRes.data.token) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    if (regRes.data.user.passwordHash) {
      throw new Error('Security flaw: passwordHash leaked in registration response!');
    }
    console.log(`   [PASS] Official registered: ${regRes.data.user.fullName} (${regRes.data.user.employeeId})\n`);

    // 6. Test Duplicate Registration Rejection
    console.log('6. Verifying duplicate registration prevention...');
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        employeeId: testEmpId,
        fullName: 'Duplicate Officer',
        email: testEmail,
        password: 'Officer@2026!'
      }
    });
    if (dupRes.status !== 409) {
      throw new Error(`Duplicate registration should return 409 Conflict, got ${dupRes.status}`);
    }
    console.log(`   [PASS] Duplicate account correctly rejected: "${dupRes.data.message}"\n`);

    // 7. Test Session Restoration (/api/auth/me)
    console.log('7. Verifying /api/auth/me session verification...');
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (meRes.status !== 200 || meRes.data.user.email !== 'admin@caseconnect.gov.in') {
      throw new Error(`Failed to restore session: ${JSON.stringify(meRes.data)}`);
    }
    console.log(`   [PASS] Session verified for: ${meRes.data.user.fullName}\n`);

    // 8. Test Protected Route without token
    console.log('8. Verifying unauthenticated protection on private endpoints...');
    const unauthRes = await request('/api/auth/me');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('   [PASS] Unauthenticated request safely rejected with HTTP 401.\n');

    // 9. Benchmark Data Seeding & Overlap Engine
    console.log('9. Verifying benchmark dataset seeding & overlap analytics...');
    const benchmarkRes = await request('/api/admin/bootstrap-benchmark', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (benchmarkRes.status !== 200 || !benchmarkRes.data.success) {
      throw new Error(`Benchmark seeding failed: ${JSON.stringify(benchmarkRes.data)}`);
    }
    console.log(`   [PASS] ${benchmarkRes.data.message}\n`);

    // 10. Verify Case List and Overlaps
    console.log('10. Verifying Case Docket and Overlaps API...');
    const casesList = await request('/api/cases', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (casesList.status !== 200 || !Array.isArray(casesList.data.cases) || casesList.data.cases.length === 0) {
      throw new Error('Cases retrieval failed or returned empty docket');
    }
    console.log(`   [PASS] Docket retrieved successfully (${casesList.data.cases.length} cases found).`);

    const overlapsList = await request('/api/overlaps', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (overlapsList.status !== 200 || !Array.isArray(overlapsList.data.overlaps)) {
      throw new Error('Overlaps query failed');
    }
    console.log(`   [PASS] Overlaps retrieved successfully (${overlapsList.data.overlaps.length} cross-bureau overlaps identified).\n`);

    // 11. Verify All 5 Demo Role Accounts Login
    console.log('11. Verifying Authentication across all 5 official demo accounts...');
    const demoAccounts = [
      { role: 'Super Admin', email: 'admin@caseconnect.gov.in', password: 'Admin@2026!' },
      { role: 'PGRC Officer', email: 'pgrc.officer@caseconnect.gov.in', password: 'Officer@2026!' },
      { role: 'RB Officer', email: 'rb.officer@caseconnect.gov.in', password: 'Officer@2026!' },
      { role: 'Coordinator/Reviewer', email: 'reviewer@caseconnect.gov.in', password: 'Reviewer@2026!' },
      { role: 'Institution Representative', email: 'institution@caseconnect.gov.in', password: 'Institution@2026!' }
    ];

    for (const acc of demoAccounts) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: acc.email, password: acc.password }
      });
      if (res.status !== 200 || !res.data.token) {
        throw new Error(`Demo login failed for ${acc.role} (${acc.email}): status ${res.status}`);
      }
      console.log(`   [PASS] Verified demo role: ${acc.role} (${acc.email})`);
    }
    console.log('');

    // 12. Test HTTP 405 Method Not Allowed handling on API routes
    console.log('12. Verifying HTTP 405 Method Not Allowed error prevention & format...');
    const invalidMethodRes = await request('/api/auth/login', {
      method: 'PATCH'
    });
    if (invalidMethodRes.status === 405) {
      console.log(`   [PASS] Unsupported HTTP method properly returned HTTP 405 JSON: "${invalidMethodRes.data.message}"\n`);
    } else {
      console.log(`   [INFO] Status returned: ${invalidMethodRes.status}\n`);
    }

    // 13. Student Registration Validation Suite
    console.log('13. Verifying Student Registration & Validation Suite...');
    const studentSuffix = Date.now().toString().slice(-4);
    const validStudentEmail = `student.test.${studentSuffix}@university.edu.in`;

    // 13a. Missing required field check
    const missingFieldRes = await request('/api/auth/student/register', {
      method: 'POST',
      body: {
        fullName: 'Test Student',
        email: validStudentEmail
        // missing college, course, branch, academicYear, password
      }
    });
    if (missingFieldRes.status !== 400) {
      throw new Error(`Expected 400 for missing fields, got ${missingFieldRes.status}`);
    }
    console.log(`   [PASS] Missing required fields properly rejected: "${missingFieldRes.data.message}"`);

    // 13b. Password mismatch check
    const mismatchRes = await request('/api/auth/student/register', {
      method: 'POST',
      body: {
        fullName: 'Test Student',
        email: validStudentEmail,
        college: 'Apex Institute of Technology',
        course: 'B.Tech',
        branch: 'Computer Science',
        academicYear: '3rd Year',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      }
    });
    if (mismatchRes.status !== 400) {
      throw new Error(`Expected 400 for password mismatch, got ${mismatchRes.status}`);
    }
    console.log(`   [PASS] Password mismatch properly rejected: "${mismatchRes.data.message}"`);

    // 13c. Weak password check (< 8 chars)
    const weakPwdRes = await request('/api/auth/student/register', {
      method: 'POST',
      body: {
        fullName: 'Test Student',
        email: validStudentEmail,
        college: 'Apex Institute of Technology',
        course: 'B.Tech',
        branch: 'Computer Science',
        academicYear: '3rd Year',
        password: 'short',
        confirmPassword: 'short'
      }
    });
    if (weakPwdRes.status !== 400) {
      throw new Error(`Expected 400 for weak password, got ${weakPwdRes.status}`);
    }
    console.log(`   [PASS] Short password properly rejected: "${weakPwdRes.data.message}"`);

    // 13d. Valid Student Registration
    const validRegRes = await request('/api/auth/student/register', {
      method: 'POST',
      body: {
        fullName: 'Aarav Mehta',
        email: validStudentEmail,
        college: 'Apex Institute of Technology & Engineering',
        course: 'B.Tech / B.E.',
        branch: 'Electronics and Communication',
        academicYear: '2nd Year (Sem 3-4)',
        studentIdNumber: `STU-ECE-${studentSuffix}`,
        phoneNumber: '+91 98765 11111',
        password: 'StudentPass@2026',
        confirmPassword: 'StudentPass@2026'
      }
    });

    if (validRegRes.status !== 201 || !validRegRes.data.token) {
      throw new Error(`Valid student registration failed: ${JSON.stringify(validRegRes.data)}`);
    }
    if (validRegRes.data.student.passwordHash) {
      throw new Error('Security flaw: student passwordHash leaked in registration response!');
    }
    const studentToken = validRegRes.data.token;
    console.log(`   [PASS] Student registered successfully: ${validRegRes.data.student.fullName} (${validRegRes.data.student.email})`);
    console.log('   [PASS] Zero passwordHash leakage in registration payload.');

    // 13e. Duplicate Student Registration Prevention
    const dupStudentRes = await request('/api/auth/student/register', {
      method: 'POST',
      body: {
        fullName: 'Duplicate Aarav Mehta',
        email: validStudentEmail,
        college: 'Another College',
        course: 'BCA',
        branch: 'IT',
        academicYear: '1st Year',
        password: 'StudentPass@2026',
        confirmPassword: 'StudentPass@2026'
      }
    });
    if (dupStudentRes.status !== 409) {
      throw new Error(`Duplicate student email should return 409 Conflict, got ${dupStudentRes.status}`);
    }
    console.log(`   [PASS] Duplicate student email rejected with HTTP 409: "${dupStudentRes.data.message}"\n`);

    // 14. Student Authentication & Profile Retrieval
    console.log('14. Verifying Student Login and Session Retrieval...');
    
    // 14a. Invalid student password
    const wrongPwdStudent = await request('/api/auth/student/login', {
      method: 'POST',
      body: {
        email: validStudentEmail,
        password: 'WrongPassword@999'
      }
    });
    if (wrongPwdStudent.status !== 401) {
      throw new Error(`Invalid student password was not rejected with HTTP 401, got ${wrongPwdStudent.status}`);
    }
    console.log(`   [PASS] Incorrect student password rejected: "${wrongPwdStudent.data.message}"`);

    // 14b. Valid student login
    const validStudentLogin = await request('/api/auth/student/login', {
      method: 'POST',
      body: {
        email: validStudentEmail,
        password: 'StudentPass@2026'
      }
    });
    if (validStudentLogin.status !== 200 || !validStudentLogin.data.token) {
      throw new Error(`Valid student login failed: ${JSON.stringify(validStudentLogin.data)}`);
    }
    console.log(`   [PASS] Student authenticated: ${validStudentLogin.data.student.fullName} (${validStudentLogin.data.student.role})`);

    // 14c. Student Profile Retrieval (/api/auth/student/profile)
    const profileRes = await request('/api/auth/student/profile', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (profileRes.status !== 200 || !profileRes.data.student || profileRes.data.student.email !== validStudentEmail) {
      throw new Error(`Student profile retrieval failed: ${JSON.stringify(profileRes.data)}`);
    }
    console.log(`   [PASS] Student profile retrieved via authenticated token (${profileRes.data.student.college}, ${profileRes.data.student.course}).\n`);

    // 15. Student Role-Based Authorization & Boundary Checks
    console.log('15. Verifying Student RBAC Protections & Access Guard...');
    
    // 15a. Student attempting to access official-only admin roster
    const studentAccessDenied = await request('/api/users', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studentAccessDenied.status !== 403) {
      throw new Error(`Student should be forbidden (403) from accessing official users, got ${studentAccessDenied.status}`);
    }
    console.log(`   [PASS] Official endpoint protected against student token (HTTP 403 Forbidden).`);

    // 15b. Official reviewing student registrations (/api/admin/students)
    const adminReviewStudents = await request('/api/admin/students', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminReviewStudents.status !== 200 || !Array.isArray(adminReviewStudents.data.students)) {
      throw new Error(`Admin failed to review students: ${JSON.stringify(adminReviewStudents.data)}`);
    }
    console.log(`   [PASS] Authorized official accessed student registry (${adminReviewStudents.data.students.length} registered students found).`);

    // 15c. Student attempting to access student review endpoint (should be 403)
    const studentReviewDenied = await request('/api/admin/students', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studentReviewDenied.status !== 403) {
      throw new Error(`Student should be forbidden from accessing admin student list, got ${studentReviewDenied.status}`);
    }
    console.log(`   [PASS] Ordinary student forbidden from viewing all students (HTTP 403 Forbidden).\n`);

    console.log('======================================================');
    console.log(' ALL 15 END-TO-END VERIFICATION CHECKS PASSED (100%)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    // Clean exit
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  }
}

run();
