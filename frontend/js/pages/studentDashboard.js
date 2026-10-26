/**
 * CaseConnect Student Portal — Dedicated Protected Student Dashboard
 * Displays authenticated student profile, academic information, grievance lodging, and regulatory protections.
 */

async function renderStudentDashboardPage(container) {
  // Show initial loading skeleton
  container.innerHTML = `
    <div style="padding: 2rem 0; text-align: center; color: var(--color-text-muted);">
      <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Loading Student Profile...</div>
      <div style="font-size: 0.85rem;">Retrieving records from institutional registry...</div>
    </div>
  `;

  let student = window.Auth?.getUser();

  // Refresh profile from server
  try {
    const refreshed = await window.Auth?.fetchMe();
    if (refreshed) student = refreshed;
  } catch (e) {
    console.warn('[Student Dashboard] Using cached student profile:', e.message);
  }

  if (!student) {
    window.location.hash = '#/student-login';
    return;
  }

  const initials = student.fullName
    ? student.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'ST';

  const regDate = student.createdAt 
    ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Active';

  container.innerHTML = `
    <div class="student-dashboard-wrapper">
      
      <!-- Student Profile Hero Banner -->
      <div class="student-hero-banner">
        <div style="display: flex; align-items: center; gap: 1.25rem;">
          <div class="student-avatar">
            ${initials}
          </div>
          <div class="student-hero-info">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <h2>${student.fullName || 'Student'}</h2>
              <span class="badge badge-green" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">
                ✓ Verified Student
              </span>
            </div>
            <p>${student.college || 'Technical Institution Student'}</p>
            <div class="student-chip-group">
              <span class="student-chip">
                ${window.Icons?.building?.('w-3.5 h-3.5') || '🏛️'}
                ${student.course || 'Degree Program'}
              </span>
              <span class="student-chip">
                ${student.branch || 'Department'}
              </span>
              <span class="student-chip">
                ${student.academicYear || 'Current Year'}
              </span>
              ${student.studentIdNumber ? `<span class="student-chip">ID: ${student.studentIdNumber}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" id="btnEditStudentProfile" style="background: rgba(255, 255, 255, 0.2); color: #fff; border: 1px solid rgba(255, 255, 255, 0.35);">
            ${window.Icons?.refresh?.('w-3.5 h-3.5') || '✏️'}
            <span>Edit Profile</span>
          </button>
          <button class="btn btn-secondary btn-sm" id="btnStudentLogout" style="background: rgba(255, 255, 255, 0.2); color: #fff; border: 1px solid rgba(255, 255, 255, 0.35);">
            ${window.Icons?.lock?.('w-3.5 h-3.5') || '🚪'}
            <span>Logout</span>
          </button>
        </div>
      </div>

      <!-- Quick Action Cards Grid -->
      <div class="grid grid-3-col" style="margin-bottom: 1.5rem;">
        
        <div class="student-action-card" id="cardLodgeGrievance">
          <div>
            <div class="student-action-icon" style="background: #eef2ff; color: var(--color-primary);">
              ${window.Icons?.cases?.('w-6 h-6') || '📝'}
            </div>
            <div class="student-action-title">Lodge Formal Grievance</div>
            <div class="student-action-desc">
              Submit an official complaint regarding fee overcharging, certificate withholding, faculty disputes, or lab deficiencies.
            </div>
          </div>
          <button class="btn btn-primary btn-sm" style="align-self: flex-start;">
            Lodge Grievance →
          </button>
        </div>

        <a href="#/institutions" class="student-action-card">
          <div>
            <div class="student-action-icon" style="background: #ecfdf5; color: #059669;">
              ${window.Icons?.building2?.('w-6 h-6') || '🏫'}
            </div>
            <div class="student-action-title">Check Institution Standing</div>
            <div class="student-action-desc">
              Look up approved technical institutions, intake limits, statutory approvals, and active regulatory monitoring cases.
            </div>
          </div>
          <span class="btn btn-secondary btn-sm" style="align-self: flex-start;">
            Search Directory →
          </span>
        </a>

        <div class="student-action-card" id="cardRegulatorySupport">
          <div>
            <div class="student-action-icon" style="background: #fffbeb; color: #d97706;">
              ${window.Icons?.clock?.('w-6 h-6') || '⏱️'}
            </div>
            <div class="student-action-title">Statutory SLA Guarantees</div>
            <div class="student-action-desc">
              All grievances lodged via CaseConnect are assigned statutory resolution windows (7 to 30 days) with automated escalation.
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" style="align-self: flex-start;">
            View SLA Rules →
          </button>
        </div>

      </div>

      <!-- Main Workspace 2-Column Split -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;" class="grid-dashboard-split">
        
        <!-- Left: Grievance Status & History -->
        <div>
          <div class="card" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <h3 class="card-title" style="margin-bottom: 0.2rem;">My Active Grievances</h3>
                <p class="card-desc">Track status updates, hearings, and official resolution remarks</p>
              </div>
              <button class="btn btn-primary btn-sm" id="btnNewGrievanceTop">
                + New Grievance
              </button>
            </div>

            <!-- Empty State for Student Grievances -->
            <div class="empty-state">
              <div class="empty-state-icon">
                ${window.Icons?.fileText?.('w-6 h-6') || '📄'}
              </div>
              <div class="empty-state-title">No Grievances Filed Yet</div>
              <div class="empty-state-desc">
                You have not submitted any regulatory complaints. If your institution violates statutory council norms or withholds credentials, you can file a complaint here.
              </div>
              <button class="btn btn-primary btn-sm" id="btnEmptyLodgeGrievance">
                Lodge a Complaint
              </button>
            </div>
          </div>

          <!-- Statutory Rights Banner -->
          <div class="rights-card">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.45rem;">
              Statutory Student Protections Under Technical Council Regulations
            </h4>
            <ul style="padding-left: 1.25rem; font-size: 0.82rem; color: #475569; line-height: 1.6;">
              <li><strong>Zero Certificate Withholding:</strong> Colleges cannot retain original marksheets or degree certificates upon student clearance.</li>
              <li><strong>Mandated Fee Refunds:</strong> Proportionate tuition refunds must be released upon admission withdrawal per statutory cut-off dates.</li>
              <li><strong>Anti-Harassment & Anti-Ragging:</strong> Severe sanctions including derecognition for unaddressed student safety complaints.</li>
              <li><strong>SLA Enforced Scrutiny:</strong> Council Scrutiny Officers must initiate formal inquiries within 7 business days of docket receipt.</li>
            </ul>
          </div>
        </div>

        <!-- Right: Student Profile & Institutional Details -->
        <div>
          <div class="card" style="margin-bottom: 1.5rem;">
            <h3 class="card-title" style="margin-bottom: 1rem;">Profile Overview</h3>
            
            <div class="student-info-row">
              <span class="student-info-label">Full Name</span>
              <span class="student-info-value">${student.fullName}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Email Address</span>
              <span class="student-info-value" style="font-size: 0.78rem;">${student.email}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Institution</span>
              <span class="student-info-value" style="max-width: 170px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${student.college}">
                ${student.college}
              </span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Program / Degree</span>
              <span class="student-info-value">${student.course}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Branch</span>
              <span class="student-info-value">${student.branch}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Year / Semester</span>
              <span class="student-info-value">${student.academicYear}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Enrollment ID</span>
              <span class="student-info-value">${student.studentIdNumber || '—'}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Phone</span>
              <span class="student-info-value">${student.phoneNumber || '—'}</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Account Status</span>
              <span class="badge badge-green" style="font-size: 0.68rem;">Active</span>
            </div>

            <div class="student-info-row">
              <span class="student-info-label">Member Since</span>
              <span class="student-info-value">${regDate}</span>
            </div>

            <div style="margin-top: 1.25rem;">
              <button class="btn btn-secondary btn-full btn-sm" id="btnEditProfileSide">
                Update Information
              </button>
            </div>
          </div>

          <!-- Helpline & Escalation -->
          <div class="card" style="background: var(--color-surface-subtle);">
            <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.35rem;">
              Regulatory Helpdesk
            </h4>
            <p style="font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">
              Centralized Public Grievance Redressal Cell (PGRC)
            </p>
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">
              Email: pgrc@caseconnect.gov.in
            </div>
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);">
              National Toll-Free: 1800-111-2026
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Attach event listeners
  document.getElementById('btnStudentLogout')?.addEventListener('click', () => {
    window.Auth?.logout();
    window.Toast?.info('Logged out successfully.');
  });

  const openGrievanceModal = () => {
    window.Toast?.info('Opening Grievance Form...');
    if (window.openCreateCaseModal) {
      window.openCreateCaseModal();
    } else {
      window.location.hash = '#/cases';
    }
  };

  document.getElementById('cardLodgeGrievance')?.addEventListener('click', openGrievanceModal);
  document.getElementById('btnNewGrievanceTop')?.addEventListener('click', openGrievanceModal);
  document.getElementById('btnEmptyLodgeGrievance')?.addEventListener('click', openGrievanceModal);

  document.getElementById('cardRegulatorySupport')?.addEventListener('click', () => {
    window.location.hash = '#/workflow-config';
  });

  const openEditModal = () => {
    const newPhone = prompt('Update Phone Number:', student.phoneNumber || '');
    const newYear = prompt('Update Academic Year / Semester:', student.academicYear || '');
    if (newPhone !== null || newYear !== null) {
      const updates = {};
      if (newPhone !== null) updates.phoneNumber = newPhone;
      if (newYear !== null) updates.academicYear = newYear;

      window.Auth?.updateStudentProfile(updates)
        .then(() => {
          window.Toast?.success('Profile updated successfully.');
          renderStudentDashboardPage(container);
        })
        .catch(err => {
          window.Toast?.error(err.message || 'Failed to update profile.');
        });
    }
  };

  document.getElementById('btnEditStudentProfile')?.addEventListener('click', openEditModal);
  document.getElementById('btnEditProfileSide')?.addEventListener('click', openEditModal);
}

window.renderStudentDashboardPage = renderStudentDashboardPage;
