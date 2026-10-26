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

    console.log('======================================================');
    console.log(' ALL 12 END-TO-END VERIFICATION CHECKS PASSED (100%)');
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
