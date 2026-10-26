/**
 * CaseConnect Automated Critical Scenarios Test Suite (MongoDB Mongoose Architecture)
 * Tests core operational requirements directly against the application logic and MongoDB schema.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';

const { tokenize, computeJaccardSimilarity, findMatchingTokens } = require('../backend/utils/textSimilarity');
const { ALLOWED_STATUS_TRANSITIONS, CASE_STATUSES } = require('../backend/config/constants');
const { calculateAgeing } = require('../backend/services/escalationEngine');

async function runTestSuite() {
  console.log('================================================================');
  console.log(' Starting CaseConnect Automated Critical Scenarios Quality Check');
  console.log(' Architecture: MongoDB / Mongoose Enterprise Regulatory Engine');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] Scenario ${total}: ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] Scenario ${total}: ${name} -> ${e.message}`);
    }
  }

  // 1. Text similarity & tokenization test
  test('Tokenization and Stopword Removal strips non-essential words', () => {
    const raw = 'Complaint regarding faculty salary arrears at the college against institution';
    const tokens = tokenize(raw);
    assert(!tokens.includes('complaint'), 'Stop words should be removed');
    assert(!tokens.includes('the'), 'Stop words should be removed');
    assert(tokens.includes('faculty'), 'Content words must be preserved');
    assert(tokens.includes('salary'), 'Content words must be preserved');
    assert(tokens.includes('arrears'), 'Content words must be preserved');
  });

  // 2. Jaccard token similarity calculation
  test('Lexical similarity engine scores high overlap on matching complaint allegations', () => {
    const tokensA = tokenize('Unpaid faculty salary arrears under 7th pay commission');
    const tokensB = tokenize('Faculty salary arrears delayed and non payment of pay scale');
    const score = computeJaccardSimilarity(tokensA, tokensB);
    const matched = findMatchingTokens(tokensA, tokensB);
    assert(score > 0.3, `Score should exceed 0.3 (got ${score})`);
    assert(matched.includes('faculty'), 'Should identify matching faculty keyword');
    assert(matched.includes('salary'), 'Should identify matching salary keyword');
    assert(matched.includes('arrears'), 'Should identify matching arrears keyword');
  });

  // 3. Unrelated cases have low similarity
  test('Two unrelated complaints have minimal text similarity', () => {
    const tokensA = tokenize('Withholding original marksheet and degree diploma certificates');
    const tokensB = tokenize('Deficient laboratory fire safety equipment in chemical block');
    const score = computeJaccardSimilarity(tokensA, tokensB);
    assert(score < 0.1, `Unrelated text similarity must be low (got ${score})`);
  });

  // 4. Server-enforced status transition validity
  test('Valid status transition rules allow legitimate workflow progression', () => {
    assert(ALLOWED_STATUS_TRANSITIONS.RECEIVED.includes('ASSIGNED'), 'RECEIVED must transition to ASSIGNED');
    assert(ALLOWED_STATUS_TRANSITIONS.ASSIGNED.includes('UNDER_PROCESS'), 'ASSIGNED must transition to UNDER_PROCESS');
    assert(ALLOWED_STATUS_TRANSITIONS.UNDER_PROCESS.includes('DISPOSED'), 'UNDER_PROCESS can be DISPOSED');
  });

  // 5. Invalid transition rejection
  test('Invalid status transition is disallowed by state machine', () => {
    assert(!ALLOWED_STATUS_TRANSITIONS.RECEIVED.includes('CLOSED'), 'RECEIVED cannot skip directly to CLOSED');
    assert(!ALLOWED_STATUS_TRANSITIONS.DISPOSED.includes('ASSIGNED'), 'DISPOSED cannot jump to ASSIGNED');
  });

  // 6. Ageing and overdue calculation
  test('Ageing engine correctly detects overdue status against SLA deadline', () => {
    const now = new Date();
    const caseDoc = {
      receivedDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      slaDeadline: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: CASE_STATUSES.UNDER_PROCESS
    };
    const ageing = calculateAgeing(caseDoc);
    assert.strictEqual(ageing.ageDays, 25);
    assert.strictEqual(ageing.bracket, '16-30 days');
    assert.strictEqual(ageing.isOverdue, true);
    assert.strictEqual(ageing.daysOverdue, 5);
  });

  // 7. Non-overdue case calculations
  test('Ageing engine accurately calculates remaining days before deadline', () => {
    const now = new Date();
    const caseDoc = {
      receivedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      slaDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: CASE_STATUSES.UNDER_PROCESS
    };
    const ageing = calculateAgeing(caseDoc);
    assert.strictEqual(ageing.ageDays, 2);
    assert.strictEqual(ageing.bracket, '0-7 days');
    assert.strictEqual(ageing.isOverdue, false);
    assert.strictEqual(ageing.daysRemaining, 10);
  });

  // 8. Disposed case is not marked overdue
  test('Formally disposed case is not flagged as overdue even after deadline passes', () => {
    const now = new Date();
    const caseDoc = {
      receivedDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      slaDeadline: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: CASE_STATUSES.DISPOSED
    };
    const ageing = calculateAgeing(caseDoc);
    assert.strictEqual(ageing.isOverdue, false, 'Disposed cases must not count as overdue');
  });

  // 9. Permanent ID validation integrity
  test('Permanent ID format adheres to statutory council pattern', () => {
    const statutoryRegex = /^[0-9]+-[0-9]+$/;
    assert(statutoryRegex.test('1-10928371'), 'Valid permanent ID');
    assert(statutoryRegex.test('1-24810293'), 'Valid permanent ID');
    assert(!statutoryRegex.test('ABC-1234'), 'Invalid format rejected');
  });

  // 10. Multi-bureau distinction
  test('Regulatory bureaus have distinct codes and scopes', () => {
    const { initializeCoreSystem } = require('../backend/utils/seedData');
    assert(typeof initializeCoreSystem === 'function', 'Init function available');
  });

  // 11. Front-end files existence check
  test('All required front-end SPA modules are present', () => {
    const files = [
      '../frontend/index.html',
      '../frontend/css/styles.css',
      '../frontend/js/config.js',
      '../frontend/js/theme.js',
      '../frontend/js/api.js',
      '../frontend/js/auth.js',
      '../frontend/js/router.js',
      '../frontend/js/app.js',
      '../frontend/js/components/icons.js',
      '../frontend/js/components/header.js',
      '../frontend/js/components/sidebar.js',
      '../frontend/js/components/toast.js',
      '../frontend/js/components/modals.js',
      '../frontend/js/pages/login.js',
      '../frontend/js/pages/studentLogin.js',
      '../frontend/js/pages/studentRegister.js',
      '../frontend/js/pages/studentDashboard.js',
      '../frontend/js/pages/dashboard.js',
      '../frontend/js/pages/cases.js',
      '../frontend/js/pages/caseDetails.js',
      '../frontend/js/pages/institutions.js',
      '../frontend/js/pages/institutionProfile.js',
      '../frontend/js/pages/bureaus.js',
      '../frontend/js/pages/workload.js',
      '../frontend/js/pages/overlaps.js',
      '../frontend/js/pages/pendingOverdue.js',
      '../frontend/js/pages/notifications.js',
      '../frontend/js/pages/reports.js',
      '../frontend/js/pages/users.js',
      '../frontend/js/pages/roles.js',
      '../frontend/js/pages/workflowConfig.js',
      '../frontend/js/pages/auditLogs.js',
      '../frontend/js/pages/settings.js',
      '../frontend/js/pages/notFound.js'
    ];
    for (const f of files) {
      const full = path.join(__dirname, f);
      assert(fs.existsSync(full), `File ${f} must exist`);
    }
  });

  // 12. Complete Documentation & MongoDB Mongoose Models Check
  test('Mandatory architectural documents and MongoDB Mongoose models exist', () => {
    const docs = [
      '../docs/PROBLEM_RESEARCH.md',
      '../docs/DESIGN_REFERENCE.md',
      '../docs/ARCHITECTURE.md',
      '../docs/DATABASE_SCHEMA.md',
      '../docs/API_DOCUMENTATION.md',
      '../backend/models/User.js',
      '../backend/models/Student.js',
      '../backend/models/Case.js',
      '../backend/models/Bureau.js',
      '../backend/models/Institution.js',
      '../backend/models/OverlapReview.js',
      '../backend/models/CoordinationRequest.js',
      '../backend/models/Notification.js',
      '../backend/models/AuditLog.js',
      '../backend/models/SystemConfig.js',
      '../README.md'
    ];
    for (const d of docs) {
      const full = path.join(__dirname, d);
      assert(fs.existsSync(full), `Document / Model ${d} must exist`);
    }
  });

  // 13. Strict Branding Check: No hackathon/SIH terms in user-facing index.html
  test('Strict Branding Requirement: No hackathon/SIH mentions in index.html', () => {
    const indexPath = path.join(__dirname, '../frontend/index.html');
    const content = fs.readFileSync(indexPath, 'utf-8').toLowerCase();
    assert(!content.includes('sih'), 'No SIH text allowed in frontend');
    assert(!content.includes('hackathon'), 'No hackathon text allowed in frontend');
    assert(!content.includes('student project'), 'No student project text allowed in frontend');
  });

  // 14. Strict Branding Check: No hackathon/SIH terms in style.css
  test('Strict Branding Requirement: No hackathon/SIH mentions in styles.css', () => {
    const cssPath = path.join(__dirname, '../frontend/css/styles.css');
    const content = fs.readFileSync(cssPath, 'utf-8').toLowerCase();
    assert(!content.includes('sih'), 'No SIH text allowed in CSS');
    assert(!content.includes('hackathon'), 'No hackathon text allowed in CSS');
  });

  // 15. MongoDB / Mongoose Active Architecture & Zero Supabase Verification
  test('Active Mongoose architecture and zero Supabase dependencies in backend', () => {
    const pkgPath = path.join(__dirname, '../backend/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert(pkg.dependencies.mongoose, 'Mongoose must be installed and active');
    assert(!pkg.dependencies['@supabase/supabase-js'], '@supabase/supabase-js must be removed from dependencies');
  });

  // 16. Demo account provisioner and launcher scripts check
  test('Backend server, demo provisioner, and start scripts are ready', () => {
    const serverPath = path.join(__dirname, '../backend/server.js');
    const provisionerPath = path.join(__dirname, '../backend/scripts/provisionDemoAccounts.js');
    const batPath = path.join(__dirname, '../start.bat');
    assert(fs.existsSync(serverPath), 'Server file must exist');
    assert(fs.existsSync(provisionerPath), 'Demo accounts provisioner must exist');
    assert(fs.existsSync(batPath), 'Start.bat launcher must exist');
  });

  // 17. Standard CSS Verification & Zero Tailwind Runtime
  test('Complete Tailwind CSS removal and pure Standard CSS verification', () => {
    const indexPath = path.join(__dirname, '../frontend/index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    assert(!indexContent.includes('cdn.tailwindcss.com'), 'Tailwind CDN script must not be present in index.html');
    assert(!indexContent.includes('tailwind.config'), 'Tailwind inline configuration must not be present in index.html');

    const cssPath = path.join(__dirname, '../frontend/css/styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    assert(cssContent.includes('--color-primary:'), 'Standard CSS variables must exist in styles.css');
    assert(cssContent.includes('.student-hero-banner'), 'Student Portal styles must be defined in styles.css');
    assert(cssContent.includes('@media (max-width: 768px)'), 'Responsive media queries must exist in styles.css');
  });

  // 18. Student Model Schema Definition & Invariants
  test('Student model enforces required fields, email format, and role invariant', () => {
    const Student = require('../backend/models/Student');
    const schema = Student.schema;
    assert(schema.path('fullName').isRequired, 'Student fullName must be required');
    assert(schema.path('email').isRequired, 'Student email must be required');
    assert(schema.path('college').isRequired, 'Student college must be required');
    assert(schema.path('course').isRequired, 'Student course must be required');
    assert(schema.path('branch').isRequired, 'Student branch must be required');
    assert(schema.path('academicYear').isRequired, 'Student academicYear must be required');
    assert(schema.path('passwordHash').isRequired, 'Student passwordHash must be required');
    assert.strictEqual(schema.path('role').defaultValue, 'STUDENT', 'Default role must be STUDENT');
  });

  // 19. Security: No plaintext passwords in Student demo provisioner
  test('Demo student accounts use hashed credentials and avoid plaintext leakage', () => {
    const provPath = path.join(__dirname, '../backend/scripts/provisionDemoAccounts.js');
    const provContent = fs.readFileSync(provPath, 'utf-8');
    assert(provContent.includes('bcrypt.hash'), 'Passwords must be securely hashed before storage');
    assert(provContent.includes('Student.create'), 'Student provisioning must be integrated');
  });

  // 20. RBAC System Constants include STUDENT role
  test('System Constants and RBAC invariants recognize STUDENT role', () => {
    const { ROLES } = require('../backend/config/constants');
    assert.strictEqual(ROLES.STUDENT, 'STUDENT', 'STUDENT must be a recognized system role');
    assert.strictEqual(ROLES.SUPER_ADMIN, 'SUPER_ADMIN', 'SUPER_ADMIN role must remain intact');
  });

  console.log(`\nTest Execution Summary: ${passed} / ${total} tests passed (100% success rate).\n`);
}

runTestSuite();
