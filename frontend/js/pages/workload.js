/**
 * Workload & Assignment Distribution Page Component
 */

async function renderWorkloadPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Workload & Assignment Distribution
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Monitor officer caseloads, active pending assignments, and capacity saturation across regulatory teams.
        </p>
      </div>

      <button class="btn btn-secondary btn-sm" onclick="loadWorkloadData()">
        ${window.Icons?.refresh('w-3.5 h-3.5') || ''}
        <span>Refresh Roster</span>
      </button>
    </div>

    <!-- Workload Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Official Name</th>
              <th>Bureau</th>
              <th>Designation</th>
              <th>Active Assigned Cases</th>
              <th>Overdue Caseload</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="workloadTableBody">
            <tr>
              <td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                Loading officer workload distribution...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadWorkloadData();
}

async function loadWorkloadData() {
  try {
    const [usersRes, casesRes] = await Promise.all([
      window.API.get('/users'),
      window.API.get('/cases')
    ]);

    const users = usersRes.users || [];
    const cases = casesRes.cases || [];
    const now = new Date();

    const tbody = document.getElementById('workloadTableBody');
    if (!tbody) return;

    if (!users.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon">
                ${window.Icons?.users('w-5 h-5 text-slate-400') || ''}
              </div>
              <div class="empty-state-title">No Officers Found</div>
              <div class="empty-state-desc">No active officers registered in the system roster.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const officerCases = cases.filter(c => String(c.assignedOfficerId) === String(u._id) || c.assignedOfficerName === u.fullName);
      const activeCases = officerCases.filter(c => !['DISPOSED', 'CLOSED'].includes(c.status));
      const overdueCases = activeCases.filter(c => now > new Date(c.slaDeadline));

      let saturationBadge = '<span class="badge badge-green">Optimal</span>';
      if (activeCases.length >= 10) saturationBadge = '<span class="badge badge-red">High Load</span>';
      else if (activeCases.length >= 5) saturationBadge = '<span class="badge badge-amber">Moderate</span>';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--color-text);">${u.fullName}</div>
            <div style="font-size: 0.7rem; color: var(--color-text-muted);">${u.email}</div>
          </td>
          <td><span class="badge badge-indigo">${u.bureauId || 'Council Cell'}</span></td>
          <td style="font-size: 0.8rem;">${u.designation || 'Scrutiny Officer'}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <span style="font-weight: 800; font-size: 1rem; color: var(--color-primary);">${activeCases.length}</span>
              ${saturationBadge}
            </div>
          </td>
          <td>
            <span class="badge ${overdueCases.length > 0 ? 'badge-red' : 'badge-gray'}">
              ${overdueCases.length} overdue
            </span>
          </td>
          <td>
            <span class="badge ${u.isActive ? 'badge-green' : 'badge-red'}">
              ${u.isActive ? 'Active' : 'Suspended'}
            </span>
          </td>
          <td style="text-align: right;">
            <a href="#/cases?query=${encodeURIComponent(u.fullName)}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">
              View Assignments →
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    window.Toast?.error('Failed loading workload: ' + err.message);
  }
}

window.renderWorkloadPage = renderWorkloadPage;
window.loadWorkloadData = loadWorkloadData;
