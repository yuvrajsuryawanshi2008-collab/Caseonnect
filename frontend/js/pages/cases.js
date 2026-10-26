/**
 * All Cases Register Page Component
 */

async function renderCasesPage(container) {
  const urlParts = window.location.hash.split('?');
  const queryParams = new URLSearchParams(urlParts[1] || '');

  const initialStatus = queryParams.get('status') || '';
  const initialBureau = queryParams.get('bureauCode') || '';
  const initialSeverity = queryParams.get('severity') || '';
  const initialQuery = queryParams.get('query') || '';

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          All Registered Cases & Complaints
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Comprehensive statutory case register across AICTE Regulation Bureau, PGRC, Approval Bureau, and Cells.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-secondary btn-sm" id="btnExportCSV">
          ${window.Icons?.download('w-3.5 h-3.5') || ''}
          <span>Export Filtered CSV</span>
        </button>
        <button class="btn btn-primary btn-sm" id="btnRegisterNewCase">
          ${window.Icons?.plus('w-3.5 h-3.5') || ''}
          <span>Register New Case</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 0.65rem; align-items: center;">
        <div>
          <input 
            type="text" 
            class="form-control" 
            id="caseFilterQuery" 
            placeholder="Search Case No., Institution, or Title..." 
            value="${initialQuery}"
          />
        </div>

        <div>
          <select class="form-control" id="caseFilterBureau">
            <option value="">All Bureaus / Cells</option>
            <option value="RB" ${initialBureau === 'RB' ? 'selected' : ''}>RB (Regulation)</option>
            <option value="PGRC" ${initialBureau === 'PGRC' ? 'selected' : ''}>PGRC (Grievance)</option>
            <option value="AB" ${initialBureau === 'AB' ? 'selected' : ''}>AB (Approval)</option>
            <option value="PAPB" ${initialBureau === 'PAPB' ? 'selected' : ''}>PAPB (Policy)</option>
            <option value="VIGILANCE" ${initialBureau === 'VIGILANCE' ? 'selected' : ''}>Vigilance</option>
          </select>
        </div>

        <div>
          <select class="form-control" id="caseFilterStatus">
            <option value="">All Statuses</option>
            <option value="RECEIVED" ${initialStatus === 'RECEIVED' ? 'selected' : ''}>Received</option>
            <option value="ASSIGNED" ${initialStatus === 'ASSIGNED' ? 'selected' : ''}>Assigned</option>
            <option value="UNDER_PROCESS" ${initialStatus === 'UNDER_PROCESS' ? 'selected' : ''}>Under Process</option>
            <option value="PENDING_RESPONSE" ${initialStatus === 'PENDING_RESPONSE' ? 'selected' : ''}>Pending Response</option>
            <option value="COORDINATION_REQUESTED" ${initialStatus === 'COORDINATION_REQUESTED' ? 'selected' : ''}>Coordination Req.</option>
            <option value="TRANSFERRED" ${initialStatus === 'TRANSFERRED' ? 'selected' : ''}>Transferred</option>
            <option value="ESCALATED" ${initialStatus === 'ESCALATED' ? 'selected' : ''}>Escalated</option>
            <option value="DISPOSED" ${initialStatus === 'DISPOSED' ? 'selected' : ''}>Disposed</option>
            <option value="CLOSED" ${initialStatus === 'CLOSED' ? 'selected' : ''}>Closed</option>
          </select>
        </div>

        <div>
          <select class="form-control" id="caseFilterSeverity">
            <option value="">All Severities</option>
            <option value="CRITICAL" ${initialSeverity === 'CRITICAL' ? 'selected' : ''}>Critical</option>
            <option value="HIGH" ${initialSeverity === 'HIGH' ? 'selected' : ''}>High</option>
            <option value="MEDIUM" ${initialSeverity === 'MEDIUM' ? 'selected' : ''}>Medium</option>
            <option value="LOW" ${initialSeverity === 'LOW' ? 'selected' : ''}>Low</option>
          </select>
        </div>

        <div>
          <button class="btn btn-secondary btn-sm" id="btnResetFilters" title="Reset Filters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Cases Data Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Institution / Permanent ID</th>
              <th>Bureau</th>
              <th>Title / Subject</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assigned Officer</th>
              <th>SLA Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="casesTableBody">
            <tr>
              <td colspan="9" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                Loading cases register...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid var(--color-border);" id="casesPagination">
        <span style="font-size: 0.78rem; color: var(--color-text-muted);" id="paginationSummary">
          Showing 0 of 0 cases
        </span>
        <div style="display: flex; gap: 0.4rem;" id="paginationButtons">
          <!-- Dynamic prev/next buttons -->
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnRegisterNewCase')?.addEventListener('click', () => window.Modals?.openRegisterCaseModal());
  document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    window.location.href = '/api/reports/export/cases-csv';
  });

  const queryInput = document.getElementById('caseFilterQuery');
  const bureauSelect = document.getElementById('caseFilterBureau');
  const statusSelect = document.getElementById('caseFilterStatus');
  const severitySelect = document.getElementById('caseFilterSeverity');

  const onFilterChange = () => fetchAndRenderCases(1);

  queryInput?.addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(onFilterChange, 300);
  });
  bureauSelect?.addEventListener('change', onFilterChange);
  statusSelect?.addEventListener('change', onFilterChange);
  severitySelect?.addEventListener('change', onFilterChange);

  document.getElementById('btnResetFilters')?.addEventListener('click', () => {
    queryInput.value = '';
    bureauSelect.value = '';
    statusSelect.value = '';
    severitySelect.value = '';
    fetchAndRenderCases(1);
  });

  fetchAndRenderCases(1);
}

async function fetchAndRenderCases(page = 1) {
  const query = document.getElementById('caseFilterQuery')?.value || '';
  const bureauCode = document.getElementById('caseFilterBureau')?.value || '';
  const status = document.getElementById('caseFilterStatus')?.value || '';
  const severity = document.getElementById('caseFilterSeverity')?.value || '';

  try {
    const res = await window.API.get('/cases', {
      page,
      limit: 15,
      query,
      bureauCode,
      status,
      severity
    });

    const tbody = document.getElementById('casesTableBody');
    const summary = document.getElementById('paginationSummary');
    const paginationBtns = document.getElementById('paginationButtons');

    if (!res.cases || !res.cases.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon">
                ${window.Icons?.search('w-5 h-5 text-slate-400') || ''}
              </div>
              <div class="empty-state-title">No Matching Cases Found</div>
              <div class="empty-state-desc">No registered complaints match the specified search or filter criteria.</div>
              <button class="btn btn-secondary btn-sm" onclick="document.getElementById('btnResetFilters').click()">Clear Filters</button>
            </div>
          </td>
        </tr>
      `;
      summary.textContent = 'Showing 0 cases';
      paginationBtns.innerHTML = '';
      return;
    }

    summary.textContent = `Showing ${(page - 1) * 15 + 1}–${Math.min(page * 15, res.total)} of ${res.total} cases`;

    tbody.innerHTML = res.cases.map(c => `
      <tr>
        <td>
          <a href="#/cases/${c._id}" style="font-weight: 700; color: var(--color-primary); font-family: monospace;">
            ${c.caseNumber}
          </a>
          ${c.hasPotentialOverlap ? `<span class="badge badge-amber" style="margin-left: 0.35rem; font-size: 0.65rem;" title="Cross-Bureau Overlap Flagged">Overlap</span>` : ''}
        </td>
        <td>
          <a href="#/institutions/${c.institutionId}" style="font-weight: 600; font-size: 0.82rem; color: var(--color-text);">
            ${c.institutionName}
          </a>
          <div style="font-size: 0.7rem; color: var(--color-text-muted); font-family: monospace;">ID: ${c.permanentId}</div>
        </td>
        <td>
          <span class="badge badge-indigo">${c.bureauCode}</span>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.82rem; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.title}">
            ${c.title}
          </div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted);">${c.category}</div>
        </td>
        <td>
          <span class="badge ${window.CONFIG?.SEVERITY_BADGES[c.severity]?.class || 'badge-gray'}">${c.severity}</span>
        </td>
        <td>
          <span class="badge ${window.CONFIG?.STATUS_BADGES[c.status]?.class || 'badge-gray'}">${c.status}</span>
        </td>
        <td style="font-size: 0.78rem;">
          ${c.assignedOfficerName || '<span style="color: var(--color-text-muted);">Unassigned</span>'}
        </td>
        <td style="font-size: 0.78rem;">
          ${c.isOverdue ? `
            <span style="color: var(--color-danger); font-weight: 700;">Overdue (${c.daysOverdue}d)</span>
          ` : `
            <span style="color: #475569;">${c.daysRemaining}d left</span>
          `}
        </td>
        <td style="text-align: right;">
          <a href="#/cases/${c._id}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">
            Dossier →
          </a>
        </td>
      </tr>
    `).join('');

    let btns = '';
    if (page > 1) {
      btns += `<button class="btn btn-secondary btn-sm" onclick="fetchAndRenderCases(${page - 1})">← Previous</button>`;
    }
    if (page < res.totalPages) {
      btns += `<button class="btn btn-secondary btn-sm" onclick="fetchAndRenderCases(${page + 1})">Next →</button>`;
    }
    paginationBtns.innerHTML = btns;
  } catch (err) {
    window.Toast?.error('Failed loading cases list: ' + err.message);
  }
}

window.renderCasesPage = renderCasesPage;
window.fetchAndRenderCases = fetchAndRenderCases;
