/**
 * CaseConnect Student Portal — Dedicated Student Registration Component
 * Built with standard maintainable CSS, responsive multi-column layout, and robust form validation.
 */

function renderStudentRegisterPage(container) {
  container.innerHTML = `
    <div class="auth-page-wrapper">
      <div class="auth-card" style="max-width: 580px;">
        
        <!-- Portal Brand Header -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="width: 52px; height: 52px; border-radius: 12px; background: var(--color-primary-light); color: var(--color-primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);">
            ${window.Icons?.logoEmblem?.('w-7 h-7 text-indigo-600') || ''}
          </div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); margin-bottom: 0.25rem;">
            User Registration
          </h2>
          <p style="font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45;">
            Register to lodge grievances, track complaints, and monitor AICTE institutional regulatory compliance.
          </p>
        </div>

        <!-- Navigation Tabs: Sign-In vs Register -->
        <div class="auth-tab-group">
          <a href="#/student-login" class="auth-tab-btn" style="text-align: center; text-decoration: none;">
            User Sign-In
          </a>
          <button type="button" class="auth-tab-btn active" id="tabStudentRegister">
            Register User
          </button>
        </div>

        <!-- Inline Alert Banner -->
        <div id="studentRegAlertBox" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 1.25rem; line-height: 1.45;"></div>

        <!-- User Registration Form -->
        <form id="studentRegisterForm">
          
          <!-- User Type Dropdown (new) -->
          <div class="form-group" style="margin-bottom: 0.95rem;">
            <label class="form-label" for="regUserType">User Type *</label>
            <select id="regUserType" class="form-control" required style="background: var(--color-surface);">
              <option value="">Select User Type</option>
              <option value="Faculty">Faculty Member</option>
              <option value="Stakeholder">Stakeholder (Dept. Head / Industry Partner)</option>
              <option value="Institution Representative">Institution Representative (Student)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0.95rem;">
            <label class="form-label" for="regStudentFullName">Full Name *</label>
            <input 
              type="text" 
              class="form-control" 
              id="regStudentFullName" 
              placeholder="e.g. Priya Sundaram" 
              required 
              autocomplete="name"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0.95rem;">
            <label class="form-label" for="regStudentEmail">Email Address *</label>
            <input 
              type="email" 
              class="form-control" 
              id="regStudentEmail" 
              placeholder="priya.student@university.edu.in" 
              required 
              autocomplete="email"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0.95rem;">
            <label class="form-label" for="regStudentCollege">College / Institution *</label>
            <input 
              type="text" 
              class="form-control" 
              id="regStudentCollege" 
              placeholder="e.g. Apex Institute of Technology & Engineering" 
              required 
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.95rem;">
            <div>
              <label class="form-label" for="regStudentCourse">Course / Degree *</label>
              <select id="regStudentCourse" class="form-control" required style="background: var(--color-surface);">
                <option value="">Select Course</option>
                <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                <option value="M.Tech / M.E.">M.Tech / M.E.</option>
                <option value="BCA / MCA">BCA / MCA</option>
                <option value="MBA / PGDM">MBA / PGDM</option>
                <option value="Diploma Engineering">Diploma Engineering</option>
                <option value="B.Pharm / M.Pharm">B.Pharm / M.Pharm</option>
                <option value="B.Arch / M.Arch">B.Arch / M.Arch</option>
                <option value="Other Technical Program">Other Technical Program</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="regStudentBranch">Branch / Department *</label>
              <input 
                type="text" 
                class="form-control" 
                id="regStudentBranch" 
                placeholder="e.g. Computer Science" 
                required 
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.95rem;">
            <div>
              <label class="form-label" for="regStudentYear">Academic Year / Semester *</label>
              <select id="regStudentYear" class="form-control" required style="background: var(--color-surface);">
                <option value="">Select Year</option>
                <option value="1st Year (Sem 1-2)">1st Year (Sem 1-2)</option>
                <option value="2nd Year (Sem 3-4)">2nd Year (Sem 3-4)</option>
                <option value="3rd Year (Sem 5-6)">3rd Year (Sem 5-6)</option>
                <option value="4th Year (Sem 7-8)">4th Year (Sem 7-8)</option>
                <option value="Final Semester">Final Semester</option>
                <option value="Postgraduate Year 1">Postgraduate Year 1</option>
                <option value="Postgraduate Year 2">Postgraduate Year 2</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="regStudentIdNumber">Roll / Enrollment ID</label>
              <input 
                type="text" 
                class="form-control" 
                id="regStudentIdNumber" 
                placeholder="e.g. 2024-CSE-089" 
              />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0.95rem;">
            <label class="form-label" for="regStudentPhone">Mobile Phone (Optional)</label>
            <input 
              type="tel" 
              class="form-control" 
              id="regStudentPhone" 
              placeholder="+91 98765 00000" 
              autocomplete="tel"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.25rem;">
            <div>
              <label class="form-label" for="regStudentPassword">Password (Min 8 chars) *</label>
              <input 
                type="password" 
                class="form-control" 
                id="regStudentPassword" 
                placeholder="••••••••••••" 
                required 
                autocomplete="new-password"
              />
            </div>
            <div>
              <label class="form-label" for="regStudentConfirmPassword">Confirm Password *</label>
              <input 
                type="password" 
                class="form-control" 
                id="regStudentConfirmPassword" 
                placeholder="••••••••••••" 
                required 
                autocomplete="new-password"
              />
            </div>
          </div>

          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 1.25rem; line-height: 1.45;">
            By registering, you confirm you are a bona-fide student of an affiliated technical institution. Your records are safeguarded under regulatory privacy guidelines.
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="studentRegSubmitBtn" style="padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 700;">
            <span>Complete Registration & Open Dashboard</span>
            ${window.Icons?.arrowRight?.('w-4 h-4') || '→'}
          </button>
        </form>

        <div style="margin-top: 1.25rem; text-align: center; font-size: 0.8rem; color: var(--color-text-muted);">
          Already registered? 
          <a href="#/student-login" style="font-weight: 700; color: var(--color-primary);">Sign In here</a>
        </div>
      </div>
    </div>
  `;

  const alertBox = document.getElementById('studentRegAlertBox');
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

  // Handle user registration submit
  document.getElementById('studentRegisterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const userType = document.getElementById('regUserType').value;
    const fullName = document.getElementById('regStudentFullName').value.trim();
    const email = document.getElementById('regStudentEmail').value.trim();
    const college = document.getElementById('regStudentCollege').value.trim();
    const course = document.getElementById('regStudentCourse').value;
    const branch = document.getElementById('regStudentBranch').value.trim();
    const academicYear = document.getElementById('regStudentYear').value;
    const studentIdNumber = document.getElementById('regStudentIdNumber').value.trim();
    const phoneNumber = document.getElementById('regStudentPhone').value.trim();
    const password = document.getElementById('regStudentPassword').value;
    const confirmPassword = document.getElementById('regStudentConfirmPassword').value;

    // Validate userType first
    const allowedUserTypes = ['Faculty', 'Stakeholder', 'Institution Representative'];
    if (!userType || !allowedUserTypes.includes(userType)) {
      showAlert('Please select a valid User Type (Faculty, Stakeholder, or Institution Representative).');
      // Restore dropdown selection after validation error
      const sel = document.getElementById('regUserType');
      if (sel) sel.value = userType;
      return;
    }

    // Frontend validation
    if (fullName.length < 2) {
      showAlert('Full name must be at least 2 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Password and confirmation password do not match.');
      return;
    }

    if (password.length < 8) {
      showAlert('Password must be at least 8 characters long.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      showAlert('Password must contain both letters and at least one number.');
      return;
    }

    const btn = document.getElementById('studentRegSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = `<span>Registering ${userType} account...</span>`;

    try {
      await window.Auth?.userRegister({
        userType,
        fullName,
        email,
        college,
        course,
        branch,
        academicYear,
        studentIdNumber,
        phoneNumber,
        password,
        confirmPassword
      });

      showAlert(`${userType} registration successful! Redirecting to dashboard...`, true);
      window.Toast?.success(`${userType} account registered. Welcome to CaseConnect!`);
      setTimeout(() => {
        window.location.hash = '#/student-dashboard';
      }, 700);
    } catch (err) {
      showAlert(err.message || 'Registration failed. Please check submitted data.');
      window.Toast?.error(err.message || 'Registration failed.');
      btn.disabled = false;
      btn.innerHTML = `<span>Complete Registration & Open Dashboard</span> ${window.Icons?.arrowRight?.('w-4 h-4') || '→'}`;
    }
  });
}

window.renderStudentRegisterPage = renderStudentRegisterPage;
