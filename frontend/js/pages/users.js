/**
 * Authorized Users & Officials Management Page Component
 */

async function renderUsersPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Authorized Regulatory Officials
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Manage institutional monitoring officers, bureau assignees, regional reviewers, and council auditors.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-primary btn-sm" id="btnCreateUser">
          ${window.Icons?.plus('w-3.5 h-3.5') || ''}
          <span>Add Official Account</span>
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Full Name</th>
              <th>Official Email</th>
              <th>Role</th>
              <th>Bureau Assignment</th>
              <th>Designation</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr>
              <td colspan="8" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                Loading authorized officials roster...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnCreateUser')?.addEventListener('click', () => {
    openCreateUserModal();
  });

  loadUsersData();
}

async function loadUsersData() {
  try {
    const res = await window.API.get('/users');
    const users = res.users || [];
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">
                ${window.Icons?.users('w-5 h-5 text-slate-400') || ''}
              </div>
              <div class="empty-state-title">No Officials Found</div>
              <div class="empty-state-desc">Click 'Add Official Account' to create authorized personnel access.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="font-family: monospace; font-weight: 700;">${u.employeeId}</td>
        <td>
          <div style="font-weight: 700; color: var(--color-text);">${u.fullName}</div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted);">${u.phoneNumber || ''}</div>
        </td>
        <td style="font-size: 0.8rem;">${u.email}</td>
        <td><span class="badge badge-purple">${u.role.replace(/_/g, ' ')}</span></td>
        <td><span class="badge badge-indigo">${u.bureauId || 'Council Cell'}</span></td>
        <td style="font-size: 0.8rem;">${u.designation || 'Scrutiny Officer'}</td>
        <td>
          <span class="badge ${u.isActive ? 'badge-green' : 'badge-red'}">
            ${u.isActive ? 'Active' : 'Suspended'}
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;" onclick="toggleUserStatus('${u._id}')">
            ${u.isActive ? 'Suspend' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    window.Toast?.error('Failed loading officials roster: ' + err.message);
  }
}

async function toggleUserStatus(id) {
  try {
    const res = await window.API.put(`/users/${id}/toggle-status`);
    window.Toast.success(res.message);
    loadUsersData();
  } catch (err) {
    window.Toast.error(err.message || 'Status toggle failed.');
  }
}

function openCreateUserModal() {
  window.Modals.ensureContainer();
  window.Modals.container.innerHTML = `
    <div class="modal-overlay active">
      <div class="modal-container" style="max-width: 560px;">
        <div class="modal-header">
          <div class="modal-title">Create Official Account</div>
          <button class="modal-close-btn" onclick="window.Modals.closeAll()">
            ${window.Icons?.x('w-4 h-4') || '✕'}
          </button>
        </div>
        <div class="modal-body">
          <form id="createUserForm">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="empId">Employee / Official ID *</label>
                <input type="text" class="form-control" id="empId" placeholder="e.g. OFF-RB-02" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="empFullName">Full Name *</label>
                <input type="text" class="form-control" id="empFullName" placeholder="Dr. / Shri Full Name" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="empEmail">Official Council Email *</label>
                <input type="email" class="form-control" id="empEmail" placeholder="officer@caseconnect.gov.in" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="empPassword">Initial Password *</label>
                <input type="password" class="form-control" id="empPassword" placeholder="Min 8 characters" required minlength="8" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="empRole">System Role *</label>
                <select class="form-control" id="empRole" required>
                  <option value="BUREAU_OFFICER">Bureau / Cell Officer</option>
                  <option value="SENIOR_MONITORING_OFFICER">Senior Monitoring Officer</option>
                  <option value="REGIONAL_REVIEWER">Regional Reviewing Officer</option>
                  <option value="AUDITOR">Auditor (Read-Only)</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="empBureau">Bureau Assignment *</label>
                <select class="form-control" id="empBureau" required>
                  <option value="RB">Regulation Bureau (RB)</option>
                  <option value="PGRC">Public Grievance Redressal Cell (PGRC)</option>
                  <option value="AB">Approval Bureau (AB)</option>
                  <option value="PAPB">Policy Bureau (PAPB)</option>
                  <option value="VIGILANCE">Chief Vigilance Cell</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="empDesignation">Official Designation</label>
              <input type="text" class="form-control" id="empDesignation" placeholder="e.g. Deputy Director / Scrutiny Officer" />
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
              <button type="button" class="btn btn-secondary" onclick="window.Modals.closeAll()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('createUserForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      employeeId: document.getElementById('empId').value.trim(),
      fullName: document.getElementById('empFullName').value.trim(),
      email: document.getElementById('empEmail').value.trim(),
      password: document.getElementById('empPassword').value,
      role: document.getElementById('empRole').value,
      bureauId: document.getElementById('empBureau').value,
      designation: document.getElementById('empDesignation').value.trim()
    };

    try {
      await window.API.post('/users', body);
      window.Toast.success('Official account created.');
      window.Modals.closeAll();
      loadUsersData();
    } catch (err) {
      window.Toast.error(err.message || 'Account creation failed.');
    }
  });
}

window.renderUsersPage = renderUsersPage;
window.toggleUserStatus = toggleUserStatus;
