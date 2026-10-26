/**
 * CaseConnect User Portal — Generic Login Component
 * Supports Faculty, Stakeholder, and Institution Representative roles.
 * Built with standard maintainable CSS and clean form validation.
 */

function renderStudentLoginPage(container) {
  container.innerHTML = `
    <div class="auth-page-wrapper">
      <div class="auth-card" style="max-width: 480px;">
        
        <!-- Portal Brand Header -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="width: 52px; height: 52px; border-radius: 12px; background: var(--color-primary-light); color: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);">
            ${window.Icons?.logoEmblem?.('w-7 h-7 text-indigo-600') || ''}
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); margin-bottom: 0.25rem;">
            User Login Portal
          </h2>
          <p style="font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45;">
            AICTE Institution Grievance Redressal &amp; Complaint Monitoring
          </p>
        </div>

        <!-- Portal Role Selector Pill -->
        <div class="auth-portal-selector">
          <button type="button" class="auth-portal-btn active" id="btnActiveStudentPortal">
            ${window.Icons?.users?.('w-4 h-4') || '👤'}
            <span>User Portal</span>
          </button>
          <a href="#/login" class="auth-portal-btn" style="text-decoration: none;">
            ${window.Icons?.shield?.('w-4 h-4') || '🏛️'}
            <span>Official Console</span>
          </a>
        </div>

        <!-- Navigation Tabs: Sign-In vs Register -->
        <div class="auth-tab-group">
          <button type="button" class="auth-tab-btn active" id="tabStudentSignIn">
            User Sign-In
          </button>
          <a href="#/student-register" class="auth-tab-btn" style="text-align: center; text-decoration: none;">
            Register User
          </a>
        </div>

        <!-- Inline Error Banner -->
        <div id="studentLoginAlertBox" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 1.25rem; line-height: 1.45;"></div>

        <!-- User Sign In Form -->
        <form id="studentLoginForm">
          <div class="form-group" style="margin-bottom: 1.15rem;">
            <label class="form-label" for="studentLoginEmail">Registered Email Address</label>
            <input 
              type="email" 
              class="form-control" 
              id="studentLoginEmail" 
              placeholder="user@institution.edu.in" 
              required 
              autocomplete="email"
              style="padding: 0.65rem 0.85rem; font-size: 0.88rem;"
            />
          </div>

          <div class="form-group" style="margin-bottom: 1.15rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label class="form-label" for="studentLoginPassword" style="margin-bottom: 0;">Password</label>
              <button type="button" id="toggleStudentPassword" style="border: none; background: transparent; font-size: 0.72rem; color: var(--color-primary); cursor: pointer; font-weight: 600;">
                Show
              </button>
            </div>
            <input 
              type="password" 
              class="form-control" 
              id="studentLoginPassword" 
              placeholder="••••••••••••" 
              required 
              autocomplete="current-password"
              style="padding: 0.65rem 0.85rem; font-size: 0.88rem;"
            />
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin: 1rem 0 1.35rem;">
            <label style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; color: var(--color-text-muted); cursor: pointer;">
              <input type="checkbox" id="studentRememberSession" checked style="accent-color: var(--color-primary);" /> 
              Remember session
            </label>
            <a href="javascript:void(0)" onclick="alert('User Support: For password recovery, contact your institution grievance cell or CaseConnect support desk.')" style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">
              Need help?
            </a>
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="studentLoginSubmitBtn" style="padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 700;">
            <span>Sign In to User Dashboard</span>
            ${window.Icons?.arrowRight?.('w-4 h-4') || '→'}
          </button>
        </form>

        <!-- Demo User Account Quick Autofill -->
        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--color-border);">
          <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin-bottom: 0.65rem; text-align: center;">
            Demo Accounts (Click to Autofill)
          </div>
          <button type="button" class="btn btn-secondary btn-sm" style="width: 100%; justify-content: flex-start; text-align: left; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); margin-bottom: 0.4rem;" onclick="populateStudentCredentials('student@caseconnect.gov.in', 'Student@2026!')">
            <span class="badge badge-indigo" style="font-size: 0.68rem;">Institution Rep</span>
            <span style="font-size: 0.78rem; margin-left: 0.5rem; font-weight: 600;">student@caseconnect.gov.in</span>
          </button>
        </div>

        <div style="margin-top: 1.25rem; text-align: center; font-size: 0.8rem; color: var(--color-text-muted);">
          Don't have an account yet? 
          <a href="#/student-register" style="font-weight: 700; color: var(--color-primary);">Register here</a>
        </div>
      </div>
    </div>
  `;

  const alertBox = document.getElementById('studentLoginAlertBox');
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

  // Toggle password visibility
  document.getElementById('toggleStudentPassword')?.addEventListener('click', (e) => {
    const pwdInput = document.getElementById('studentLoginPassword');
    if (!pwdInput) return;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      e.target.innerText = 'Hide';
    } else {
      pwdInput.type = 'password';
      e.target.innerText = 'Show';
    }
  });

  // Handle user login submit — tries /user/login first, falls back to /student/login
  document.getElementById('studentLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById('studentLoginEmail').value.trim();
    const password = document.getElementById('studentLoginPassword').value;

    const btn = document.getElementById('studentLoginSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = `<span>Verifying account...</span>`;

    try {
      await window.Auth?.userLogin(email, password);
      window.Toast?.success('Welcome to User Portal.');
      window.location.hash = '#/student-dashboard';
    } catch (err) {
      showAlert(err.message || 'Authentication failed. Please check your credentials.');
      window.Toast?.error(err.message || 'Authentication failed.');
      btn.disabled = false;
      btn.innerHTML = `<span>Sign In to User Dashboard</span> ${window.Icons?.arrowRight?.('w-4 h-4') || '→'}`;
    }
  });
}

function populateStudentCredentials(email, pwd) {
  const emailInput = document.getElementById('studentLoginEmail');
  const pwdInput = document.getElementById('studentLoginPassword');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = pwd;
}

window.renderStudentLoginPage = renderStudentLoginPage;
window.populateStudentCredentials = populateStudentCredentials;
