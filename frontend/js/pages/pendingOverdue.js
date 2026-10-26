/**
 * Pending & Overdue Cases Page Component (Ageing & SLA Tracking)
 */

async function renderPendingOverduePage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Pending & Overdue Regulatory Matters
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Ageing distribution analysis (0–7d, 8–15d, 16–30d, >30d), impending SLA breaches, and escalation dockets.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-secondary btn-sm" onclick="loadPendingOverdueData()">
          ${window.Icons?.refresh('w-3.5 h-3.5') || ''}
          <span>Refresh Ageing</span>
        </button>
      </div>
    </div>

    <!-- Ageing Bracket Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;" id="ageingCardsGrid">
      <div class="kpi-card" style="cursor: pointer; border-left: 3px solid var(--color-danger);" onclick="filterByBracket('OVERDUE')">
        <div>
          <div class="kpi-val" style="color: var(--color-danger);" id="bracketOverdueCount">0</div>
          <div class="kpi-label">SLA Overdue</div>
        </div>
        <div class="kpi-icon-box" style="background: #fee2e2; color: #b91c1c;">
          ${window.Icons?.alertTriangle('w-4 h-4') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer; border-left: 3px solid #ef4444;" onclick="filterByBracket('>30 days')">
        <div>
          <div class="kpi-val" id="bracket30Count">0</div>
          <div class="kpi-label">>30 Days Pending</div>
        </div>
        <div class="kpi-icon-box" style="background: #fee2e2; color: #b91c1c;">
          ${window.Icons?.clock('w-4 h-4') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer; border-left: 3px solid #f59e0b;" onclick="filterByBracket('16-30 days')">
        <div>
          <div class="kpi-val" id="bracket16Count">0</div>
          <div class="kpi-label">16–30 Days Pending</div>
        </div>
        <div class="kpi-icon-box" style="background: #fffbeb; color: #b45309;">
          ${window.Icons?.clock('w-4 h-4') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer; border-left: 3px solid #10b981;" onclick="filterByBracket('0-7 days')">
        <div>
          <div class="kpi-val" id="bracket0Count">0</div>
          <div class="kpi-label">0–7 Days (New)</div>
        </div>
        <div class="kpi-icon-box" style="background: #ecfdf5; color: #065f46;">
          ${window.Icons?.clock('w-4 h-4') || ''}
        </div>
      </div>
    </div>

    <!-- Filtered Cases Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
        <h3 class="card-title" id="activeFilterHeading" style="margin-bottom: 0;">SLA Overdue & Ageing Cases</h3>
        <span class="badge badge-gray" id="pendingListCount">0 cases</span>
      </div>

      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Institution</th>
              <th>Bureau</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Ageing Bracket</th>
              <th>Days Open</th>
              <th>SLA Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="pendingTableBody">
            <tr>
              <td colspan="9" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                Loading pending and overdue matters...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadPendingOverdueData();
}

let _allPendingCases = [];

async function loadPendingOverdueData() {
  try {
    const res = await window.API.get('/cases');
    const cases = res.cases || [];

    _allPendingCases = cases.filter(c => !['DISPOSED', 'CLOSED'].includes(c.status));

    let overdueCount = 0;
    let b30 = 0;
    let b16 = 0;
    let b0 = 0;

    _allPendingCases.forEach(c => {
      if (c.isOverdue) overdueCount++;
      if (c.ageBracket === '>30 days') b30++;
      else if (c.ageBracket === '16-30 days') b16++;
      else if (c.ageBracket === '0-7 days') b0++;
    });

    document.getElementById('bracketOverdueCount').textContent = overdueCount;
    document.getElementById('bracket30Count').textContent = b30;
    document.getElementById('bracket16Count').textContent = b16;
    document.getElementById('bracket0Count').textContent = b0;

    filterByBracket(overdueCount > 0 ? 'OVERDUE' : 'ALL');
  } catch (err) {
    window.Toast?.error('Failed loading pending matters: ' + err.message);
  }
}

function filterByBracket(bracket) {
  let filtered = _allPendingCases;
  const heading = document.getElementById('activeFilterHeading');

  if (bracket === 'OVERDUE') {
    filtered = _allPendingCases.filter(c => c.isOverdue);
    if (heading) heading.textContent = 'Matters Breaching Statutory SLA Deadlines (Overdue)';
  } else if (bracket === 'ALL') {
    if (heading) heading.textContent = 'All Active Pending Inquiries';
  } else {
    filtered = _allPendingCases.filter(c => c.ageBracket === bracket);
    if (heading) heading.textContent = `Cases in Ageing Bracket: ${bracket}`;
  }

  const badgeCount = document.getElementById('pendingListCount');
  if (badgeCount) badgeCount.textContent = `${filtered.length} cases`;

  const tbody = document.getElementById('pendingTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <div class="empty-state-icon">
              ${window.Icons?.checkCircle('w-5 h-5 text-emerald-600') || ''}
            </div>
            <div class="empty-state-title">No Overdue Matters in this Category</div>
            <div class="empty-state-desc">All institutional complaints in this category are operating within SLA deadlines.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>
        <a href="#/cases/${c._id}" style="font-weight: 700; color: var(--color-primary); font-family: monospace;">
          ${c.caseNumber}
        </a>
      </td>
      <td>
        <div style="font-weight: 600; font-size: 0.82rem;">${c.institutionName}</div>
        <div style="font-size: 0.7rem; color: var(--color-text-muted); font-family: monospace;">ID: ${c.permanentId}</div>
      </td>
      <td><span class="badge badge-indigo">${c.bureauCode}</span></td>
      <td><span class="badge ${window.CONFIG?.SEVERITY_BADGES[c.severity]?.class || 'badge-gray'}">${c.severity}</span></td>
      <td><span class="badge ${window.CONFIG?.STATUS_BADGES[c.status]?.class || 'badge-gray'}">${c.status}</span></td>
      <td><span class="badge badge-gray">${c.ageBracket}</span></td>
      <td style="font-size: 0.8rem; font-weight: 600;">${c.ageDays} days</td>
      <td style="font-size: 0.8rem;">
        ${c.isOverdue 
          ? `<span style="color: var(--color-danger); font-weight: 800;">BREACHED by ${c.daysOverdue}d</span>` 
          : `<span style="color: #10b981; font-weight: 600;">${c.daysRemaining}d to deadline</span>`}
      </td>
      <td style="text-align: right;">
        <a href="#/cases/${c._id}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">
          Action →
        </a>
      </td>
    </tr>
  `).join('');
}

window.renderPendingOverduePage = renderPendingOverduePage;
window.loadPendingOverdueData = loadPendingOverdueData;
window.filterByBracket = filterByBracket;
