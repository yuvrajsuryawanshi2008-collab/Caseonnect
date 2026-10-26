/**
 * Institutions Directory Page Component
 */

async function renderInstitutionsPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Technical Institutions Directory
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Unified statutory repository of technical colleges, engineering institutes, polytechnics, and management schools.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-primary btn-sm" id="btnAddInstitution">
          ${window.Icons?.plus('w-3.5 h-3.5') || ''}
          <span>Register Institution</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card" style="padding: 1rem; margin-bottom: 1.25rem;">
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.65rem; align-items: center;">
        <div>
          <input 
            type="text" 
            class="form-control" 
            id="instSearchQuery" 
            placeholder="Search Institution Name, Permanent ID (e.g. 1-10928371), or City..." 
          />
        </div>
        <div>
          <select class="form-control" id="instFilterRegion">
            <option value="">All Regions</option>
            <option>Western</option>
            <option>Northern</option>
            <option>North-Western</option>
            <option>Central</option>
            <option>South-Western</option>
            <option>Southern</option>
            <option>Eastern</option>
          </select>
        </div>
        <div>
          <select class="form-control" id="instFilterType">
            <option value="">All Types</option>
            <option>Unaided-Private</option>
            <option>Government</option>
            <option>Govt-Aided</option>
            <option>University-Dept</option>
            <option>Deemed-University</option>
          </select>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm" id="btnResetInstFilters">Reset</button>
        </div>
      </div>
    </div>

    <!-- Institutions Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Permanent ID</th>
              <th>Institution Name</th>
              <th>Region & Location</th>
              <th>Type</th>
              <th>Approved Intake</th>
              <th>Active Cases</th>
              <th>Risk Assessment</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="institutionsTableBody">
            <tr>
              <td colspan="8" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                Loading technical institutions registry...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddInstitution')?.addEventListener('click', () => {
    window.Modals?.openAddInstitutionModal();
  });

  const queryInput = document.getElementById('instSearchQuery');
  const regionSelect = document.getElementById('instFilterRegion');
  const typeSelect = document.getElementById('instFilterType');

  const onFilterChange = () => fetchAndRenderInstitutions();

  queryInput?.addEventListener('input', () => {
    clearTimeout(window._instSearchTimer);
    window._instSearchTimer = setTimeout(onFilterChange, 300);
  });
  regionSelect?.addEventListener('change', onFilterChange);
  typeSelect?.addEventListener('change', onFilterChange);

  document.getElementById('btnResetInstFilters')?.addEventListener('click', () => {
    queryInput.value = '';
    regionSelect.value = '';
    typeSelect.value = '';
    fetchAndRenderInstitutions();
  });

  fetchAndRenderInstitutions();
}

async function fetchAndRenderInstitutions() {
  const query = document.getElementById('instSearchQuery')?.value || '';
  const region = document.getElementById('instFilterRegion')?.value || '';
  const institutionType = document.getElementById('instFilterType')?.value || '';

  try {
    const res = await window.API.get('/institutions', { query, region, institutionType });
    const tbody = document.getElementById('institutionsTableBody');

    if (!res.institutions || !res.institutions.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">
                ${window.Icons?.building('w-5 h-5 text-slate-400') || ''}
              </div>
              <div class="empty-state-title">No Institutions Found</div>
              <div class="empty-state-desc">No institution matches the current search query or filter.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = res.institutions.map(inst => {
      let riskBadge = '<span class="badge badge-green">Normal / Clean</span>';
      if (inst.riskScore >= 70) {
        riskBadge = `<span class="badge badge-red" style="font-weight: 700;">Critical (${inst.riskScore})</span>`;
      } else if (inst.riskScore >= 35) {
        riskBadge = `<span class="badge badge-amber" style="font-weight: 700;">Watchlist (${inst.riskScore})</span>`;
      } else if (inst.openCases > 0) {
        riskBadge = `<span class="badge badge-blue">Routine (${inst.riskScore})</span>`;
      }

      return `
        <tr>
          <td>
            <a href="#/institutions/${inst._id}" style="font-weight: 700; color: var(--color-primary); font-family: monospace;">
              ${inst.permanentId}
            </a>
          </td>
          <td>
            <a href="#/institutions/${inst._id}" style="font-weight: 700; font-size: 0.85rem; color: var(--color-text);">
              ${inst.name}
            </a>
            <div style="font-size: 0.72rem; color: var(--color-text-muted);">${inst.affiliatedUniversity || 'Autonomous / State Board'}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 600;">${inst.city}, ${inst.state}</div>
            <div style="font-size: 0.7rem; color: var(--color-text-muted);">${inst.region} Region</div>
          </td>
          <td>
            <span class="badge badge-gray">${inst.institutionType}</span>
          </td>
          <td style="font-size: 0.8rem;">
            ${inst.approvedIntake || 'N/A'}
          </td>
          <td>
            <span class="badge ${inst.openCases > 0 ? 'badge-amber' : 'badge-green'}">
              ${inst.openCases || 0} active / ${inst.totalCases || 0} total
            </span>
          </td>
          <td>
            ${riskBadge}
          </td>
          <td style="text-align: right;">
            <a href="#/institutions/${inst._id}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">
              360° Profile →
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    window.Toast?.error('Failed loading institutions: ' + err.message);
  }
}

window.renderInstitutionsPage = renderInstitutionsPage;
