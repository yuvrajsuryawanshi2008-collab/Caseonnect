/**
 * CaseConnect Official Authentication & Onboarding Portal
 * Follows CampusX visual design standards: crisp typography, soft elevations, 
 * clean form inputs, and responsive layout.
 */

function renderLoginPage(container) {
  container.innerHTML = `
    <div class="auth-page-wrapper" style="min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 2.5rem 1rem;">
      <div class="card auth-card" style="max-width: 480px; width: 100%; padding: 2.25rem 2.25rem; border-top: 4px solid var(--color-primary); box-shadow: var(--shadow-card); background: #ffffff; border-radius: var(--radius-lg);">
        
        <!-- Portal Brand Header -->
        <div style="text-align: center; margin-bottom: 1.75rem;">
          <div style="width: 52px; height: 52px; border-radius: 12px; background: var(--color-primary-light); color: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.85rem; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);">
            ${window.Icons?.logoEmblem('w-7 h-7 text-indigo-600') || ''}
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); margin-bottom: 0.35rem; letter-spacing: -0.025em; font-family: var(--font-display, inherit);">
            Case<span style="color: var(--color-primary);">Connect</span> Official Portal
          </h2>
          <p style="font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45; max-width: 380px; margin: 0 auto;">
            AICTE Integrated Institution Complaint Monitoring & Status Dashboard
          </p>
        </div>

        <!-- Portal Role Selector Pill -->
        <div class="auth-portal-selector">
          <a href="#/student-login" class="auth-portal-btn" style="text-decoration: none;">
            ${window.Icons?.users?.('w-4 h-4') || '🎓'}
            <span>Student Portal</span>
          </a>
          <button type="button" class="auth-portal-btn active">
            ${window.Icons?.shield?.('w-4 h-4') || '🏛️'}
            <span>Official Console</span>
          </button>
        </div>

        <!-- Navigation Tabs: Sign-In vs Register -->
        <div class="auth-tab-group" style="display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.3rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <button type="button" id="tabSignIn" class="auth-tab-btn active" style="flex: 1; padding: 0.55rem 0.75rem; border: none; background: #ffffff; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 700; color: var(--color-primary); cursor: pointer; transition: all 0.2s ease; box-shadow: var(--shadow-sm);">
            Official Sign-In
          </button>
          <button type="button" id="tabRegister" class="auth-tab-btn" style="flex: 1; padding: 0.55rem 0.75rem; border: none; background: transparent; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s ease;">
            Register Official
          </button>
        </div>

        <!-- Inline Error Banner -->
        <div id="authAlertBox" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 1.25rem; line-height: 1.45;"></div>

        <!-- SIGN IN FORM -->
        <div id="signInContainer">
          <form id="loginForm">
            <div class="form-group" style="margin-bottom: 1.15rem;">
              <label class="form-label" for="loginEmail" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">Official Council Email</label>
              <input 
                type="email" 
                class="form-control" 
                id="loginEmail" 
                placeholder="name@example.com"
                required 
                autocomplete="username"
                style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.88rem; transition: border-color 0.15s ease;"
              />
            </div>

            <div class="form-group" style="margin-bottom: 1.15rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label class="form-label" for="loginPassword" style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0;">Authorized Password</label>
                <button type="button" id="togglePasswordVisibility" style="border: none; background: transparent; font-size: 0.72rem; color: var(--color-primary); cursor: pointer; font-weight: 600;">
                  Show
                </button>
              </div>
              <input 
                type="password" 
                class="form-control" 
                id="loginPassword" 
                placeholder="••••••••••••"
                required 
                autocomplete="current-password"
                style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.88rem; transition: border-color 0.15s ease;"
              />
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0 1.35rem;">
              <label style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; color: var(--color-text-muted); cursor: pointer;">
                <input type="checkbox" id="rememberSession" checked style="accent-color: var(--color-primary);" /> Remember session token
              </label>
              <a href="javascript:void(0)" onclick="alert('Administrative Notice: To reset official credentials, contact the Council Technical Directorate or run the authorized admin bootstrap script.')" style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">
                Forgot password?
              </a>
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="loginSubmitBtn" style="width: 100%; padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 700; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--color-primary); color: #fff; border: none; cursor: pointer;">
              <span>Sign In to Official Console</span>
              ${window.Icons?.arrowRight('w-4 h-4') || '→'}
            </button>
          </form>

          <div id="officialLoginReference" style="margin-top: 1rem; padding: 0.75rem 0.9rem; border: 1px solid #fcd34d; border-radius: var(--radius-md); background: #fffbeb; font-size: 0.78rem; color: #78350f;">
            <strong style="display: block; color: #78350f; margin-bottom: 0.25rem;">SIH prototype sample — Official Console</strong>
            <span>Email: <code>pgrc.officer@caseconnect.gov.in</code></span><br />
            <span>Password: <code>Officer@2026!</code></span>
            <button type="button" id="useDemoOfficialAccount" style="display: block; margin-top: 0.45rem; padding: 0; border: 0; background: none; color: var(--color-primary); font: inherit; font-weight: 700; cursor: pointer;">Fill sample login</button>
            <span style="display: block; margin-top: 0.35rem;">Shared public demo account. Use only with synthetic prototype data.</span>
          </div>

                  </div>

        <!-- REGISTRATION FORM -->
        <div id="registerContainer" style="display: none;">
          <form id="registerForm">
            <div class="form-group" style="margin-bottom: 0.9rem;">
              <label class="form-label" for="regFullName" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Full Official Name</label>
              <input 
                type="text" 
                class="form-control" 
                id="regFullName" 
                placeholder="Dr. Rajesh Kumar" 
                required 
                style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
              />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;">
              <div>
                <label class="form-label" for="regEmpId" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Employee ID</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="regEmpId" 
                  placeholder="OFF-RB-05" 
                  required 
                  style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
                />
              </div>
              <div>
                <label class="form-label" for="regBureauId" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Bureau Cell</label>
                <select id="regBureauId" class="form-control" style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem; background: #fff;">
                  <option value="RB">Regulation Bureau (RB)</option>
                  <option value="PGRC">Public Grievance Cell (PGRC)</option>
                  <option value="AB">Approval Bureau (AB)</option>
                  <option value="PAPB">Policy & Planning (PAPB)</option>
                  <option value="VIGILANCE">Vigilance Cell</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0.9rem;">
              <label class="form-label" for="regEmail" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Official Email Address</label>
              <input 
                type="email" 
                class="form-control" 
                id="regEmail" 
                placeholder="officer.name@caseconnect.gov.in" 
                required 
                style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
              />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.9rem;">
              <div>
                <label class="form-label" for="regDesignation" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Designation</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="regDesignation" 
                  placeholder="Scrutiny Officer" 
                  value="Institutional Scrutiny Officer"
                  style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
                />
              </div>
              <div>
                <label class="form-label" for="regPhone" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Phone (Optional)</label>
                <input 
                  type="tel" 
                  class="form-control" 
                  id="regPhone" 
                  placeholder="+91 11 2958 xxxx" 
                  style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
                />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0.9rem;">
              <label class="form-label" for="regPassword" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Password (Min 8 Characters)</label>
              <input 
                type="password" 
                class="form-control" 
                id="regPassword" 
                placeholder="••••••••••••" 
                required 
                style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
              />
            </div>

            <div class="form-group" style="margin-bottom: 1.35rem;">
              <label class="form-label" for="regConfirmPassword" style="display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Confirm Password</label>
              <input 
                type="password" 
                class="form-control" 
                id="regConfirmPassword" 
                placeholder="••••••••••••" 
                required 
                style="width: 100%; padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.85rem;"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="regSubmitBtn" style="width: 100%; padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 700; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--color-primary); color: #fff; border: none; cursor: pointer;">
              <span>Complete Registration & Access Console</span>
              ${window.Icons?.arrowRight('w-4 h-4') || '→'}
            </button>
          </form>
        </div>

        <div style="margin-top: 1.5rem; font-size: 0.72rem; color: var(--color-text-muted); text-align: center; line-height: 1.45;">
          Restricted to authorized regulatory officials. All access attempts are recorded in the security audit ledger.
        </div>
      </div>
    </div>
  `;

  // Tab switching logic
  const tabSignIn = document.getElementById('tabSignIn');
  const tabRegister = document.getElementById('tabRegister');
  const signInContainer = document.getElementById('signInContainer');
  const registerContainer = document.getElementById('registerContainer');
  const alertBox = document.getElementById('authAlertBox');

  document.getElementById('useDemoOfficialAccount')?.addEventListener('click', () => {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    if (emailInput) emailInput.value = 'pgrc.officer@caseconnect.gov.in';
    if (passwordInput) passwordInput.value = 'Officer@2026!';
    document.getElementById('loginPassword')?.focus();
  });

  function showAlert(msg, isSuccess = false) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    if (isSuccess) {
      alertBox.style.background = '#ecfdf5';
      alertBox.style.border = '1px solid #a7f3d0';
      alertBox.style.color = '#065f46';
    } else {
      alertBox.style.background = '#fef2f2';
      alertBox.style.border = '1px solid #fecaca';
      alertBox.style.color = '#991b1b';
    }
    alertBox.textContent = msg;
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = 'none';
  }

  tabSignIn?.addEventListener('click', () => {
    hideAlert();
    tabSignIn.style.background = '#ffffff';
    tabSignIn.style.color = 'var(--color-primary)';
    tabSignIn.style.boxShadow = 'var(--shadow-sm)';
    tabRegister.style.background = 'transparent';
    tabRegister.style.color = '#64748b';
    tabRegister.style.boxShadow = 'none';

    signInContainer.style.display = 'block';
    registerContainer.style.display = 'none';
  });

  tabRegister?.addEventListener('click', () => {
    hideAlert();
    tabRegister.style.background = '#ffffff';
    tabRegister.style.color = 'var(--color-primary)';
    tabRegister.style.boxShadow = 'var(--shadow-sm)';
    tabSignIn.style.background = 'transparent';
    tabSignIn.style.color = '#64748b';
    tabSignIn.style.boxShadow = 'none';

    registerContainer.style.display = 'block';
    signInContainer.style.display = 'none';
  });

  // Toggle password visibility
  document.getElementById('togglePasswordVisibility')?.addEventListener('click', (e) => {
    const pwdInput = document.getElementById('loginPassword');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      e.target.innerText = 'Hide';
    } else {
      pwdInput.type = 'password';
      e.target.innerText = 'Show';
    }
  });

  // Login form handler
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = document.getElementById('loginSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = `<span>Verifying credentials...</span>`;

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      await window.Auth?.login(email, password);
      window.Toast?.success('Authentication verified. Welcome to CaseConnect.');
      window.location.hash = '#/dashboard';
    } catch (err) {
      showAlert(err.message || 'Authentication failed. Please verify credentials.');
      window.Toast?.error(err.message || 'Authentication failed.');
      btn.disabled = false;
      btn.innerHTML = `<span>Sign In to Official Console</span> ${window.Icons?.arrowRight('w-4 h-4') || '→'}`;
    }
  });

  // Registration form handler
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const fullName = document.getElementById('regFullName').value.trim();
    const employeeId = document.getElementById('regEmpId').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const bureauId = document.getElementById('regBureauId').value;
    const designation = document.getElementById('regDesignation').value.trim();
    const phoneNumber = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
      showAlert('Password and confirmation do not match.');
      return;
    }

    if (password.length < 8) {
      showAlert('Password must be at least 8 characters long.');
      return;
    }

    const btn = document.getElementById('regSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = `<span>Registering account...</span>`;

    try {
      const registration = await window.Auth?.register({
        fullName,
        employeeId,
        email,
        bureauId,
        designation,
        phoneNumber,
        password
      });

      showAlert(registration?.message || 'Registration submitted for Super Admin approval.', true);
      window.Toast?.success(registration?.message || 'Registration submitted for approval.');
      btn.disabled = false;
      btn.innerHTML = `<span>Complete Registration & Access Console</span> ${window.Icons?.arrowRight('w-4 h-4') || '→'}`;
    } catch (err) {
      showAlert(err.message || 'Failed to complete registration.');
      window.Toast?.error(err.message || 'Registration failed.');
      btn.disabled = false;
      btn.innerHTML = `<span>Complete Registration & Access Console</span> ${window.Icons?.arrowRight('w-4 h-4') || '→'}`;
    }
  });
}

window.renderLoginPage = renderLoginPage;
