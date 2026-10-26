/**
 * Central Operational Dashboard Page Component
 */

async function renderDashboardPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Regulatory Monitoring Dashboard
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Consolidated cross-bureau complaint monitoring, active investigations, and institutional scrutiny alerts.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem; align-items: center;">
        <button class="btn btn-secondary btn-sm" id="btnRefreshDashboard">
          ${window.Icons?.refresh('w-3.5 h-3.5') || ''}
          <span>Refresh</span>
        </button>
        <button class="btn btn-primary btn-sm" id="btnQuickRegister">
          ${window.Icons?.plus('w-3.5 h-3.5') || ''}
          <span>Register Complaint</span>
        </button>
      </div>
    </div>

    <!-- Database Disconnected Alert Notice Banner (If DB is offline) -->
    <div id="dbOfflineAlertBanner" style="display: none; margin-bottom: 1.25rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 0.85rem 1.15rem;">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="color: #b91c1c; flex-shrink: 0; margin-top: 0.15rem;">
          ${window.Icons?.alertTriangle('w-5 h-5') || ''}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #991b1b; font-size: 0.88rem;">Database Connection Notice: Supabase PostgreSQL Disconnected</div>
          <div style="font-size: 0.78rem; color: #7f1d1d; margin-top: 0.2rem; line-height: 1.45;">
            The backend cannot reach the configured Supabase instance. To connect your cloud database, configure <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>backend/.env</code>, or review network connectivity.
          </div>
        </div>
      </div>
    </div>

    <!-- Operational Clean Database Notice Banner -->
    <div id="benchmarkBanner" style="display: none; margin-bottom: 1.25rem; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: var(--radius-md); padding: 0.85rem 1.15rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="font-weight: 700; color: #1e1b4b; font-size: 0.85rem;">Operational Database Starting Clean</div>
          <div style="font-size: 0.78rem; color: #3730a3; margin-top: 0.15rem;">
            Zero complaints registered. You can register live cases manually or load the verified benchmark records to test cross-bureau overlap detection.
          </div>
        </div>
        <button class="btn btn-primary btn-sm" id="btnLoadBenchmark">
          ${window.Icons?.sliders('w-3.5 h-3.5') || ''}
          <span>Initialize Benchmark Records</span>
        </button>
      </div>
    </div>

    <!-- KPI Metric Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1.5rem;" id="kpiGrid">
      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/cases'">
        <div>
          <div class="kpi-val" id="kpiTotal">0</div>
          <div class="kpi-label">Total Registered</div>
        </div>
        <div class="kpi-icon-box" style="background: #eef2ff; color: #4338ca;">
          ${window.Icons?.cases('w-5 h-5') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/cases?status=UNDER_PROCESS'">
        <div>
          <div class="kpi-val" id="kpiUnderProcess">0</div>
          <div class="kpi-label">Under Process</div>
        </div>
        <div class="kpi-icon-box" style="background: #fffbeb; color: #b45309;">
          ${window.Icons?.clock('w-5 h-5') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/overlaps'">
        <div>
          <div class="kpi-val" id="kpiOverlaps" style="color: var(--color-warning);">0</div>
          <div class="kpi-label">Cross-Bureau Overlaps</div>
        </div>
        <div class="kpi-icon-box" style="background: #fef3c7; color: #b45309;">
          ${window.Icons?.gitMerge('w-5 h-5') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/pending-overdue'">
        <div>
          <div class="kpi-val" id="kpiOverdue" style="color: var(--color-danger);">0</div>
          <div class="kpi-label">SLA Overdue</div>
        </div>
        <div class="kpi-icon-box" style="background: #fee2e2; color: #b91c1c;">
          ${window.Icons?.alertTriangle('w-5 h-5') || ''}
        </div>
      </div>

      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/cases?status=DISPOSED'">
        <div>
          <div class="kpi-val" id="kpiDisposed" style="color: var(--color-success);">0</div>
          <div class="kpi-label">Disposed / Resolved</div>
        </div>
        <div class="kpi-icon-box" style="background: #ecfdf5; color: #065f46;">
          ${window.Icons?.checkCircle('w-5 h-5') || ''}
        </div>
      </div>
    </div>

    <!-- Two-Column Breakdown: Bureau Workload & Ageing Matrix -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
      <!-- Bureau Distribution Card -->
      <div class="card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
          <h3 class="card-title">Bureau / Cell Distribution</h3>
          <a href="#/bureaus" class="btn btn-secondary btn-sm">Workload Details →</a>
        </div>
        <div id="bureauDistContainer" style="display: flex; flex-direction: column; gap: 0.65rem;">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Ageing Bracket Breakdown -->
      <div class="card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
          <h3 class="card-title">Active Complaint Ageing Matrix</h3>
          <a href="#/pending-overdue" class="btn btn-secondary btn-sm">Ageing Breakdown →</a>
        </div>
        <div id="ageingDistContainer" style="display: flex; flex-direction: column; gap: 0.65rem;">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>

    <!-- Recent Docket Registrations Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h3 class="card-title" style="margin-bottom: 0.15rem;">Recent Complaint Docket Registrations</h3>
          <p class="card-desc">Latest cases filed across Council Bureaus, Regulatory Cells, and Regional Directorates</p>
        </div>
        <a href="#/cases" class="btn btn-secondary btn-sm">All Cases →</a>
      </div>

      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Technical Institution</th>
              <th>Bureau</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>SLA Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="recentCasesTableBody">
            <tr>
              <td colspan="8" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">
                Loading recent docket activity...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnRefreshDashboard')?.addEventListener('click', () => loadDashboardData());
  document.getElementById('btnQuickRegister')?.addEventListener('click', () => window.Modals?.openRegisterCaseModal());
  document.getElementById('btnLoadBenchmark')?.addEventListener('click', async () => {
    try {
      const res = await window.API.post('/admin/bootstrap-benchmark');
      window.Toast.success(res.message || 'Benchmark records initialized.');
      loadDashboardData();
    } catch (e) {
      window.Toast.error(e.message || 'Benchmark initialization failed.');
    }
  });

  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const healthRes = await window.API.get('/health');
    const dbOfflineBanner = document.getElementById('dbOfflineAlertBanner');
    if (dbOfflineBanner) {
      dbOfflineBanner.style.display = healthRes.database?.connected ? 'none' : 'block';
    }

    const [statsRes, casesRes] = await Promise.all([
      window.API.get('/reports/dashboard-stats'),
      window.API.get('/cases', { limit: 5 })
    ]);

    const stats = statsRes.stats || {};

    document.getElementById('kpiTotal').textContent = stats.total || 0;
    document.getElementById('kpiUnderProcess').textContent = stats.underProcess || 0;
    document.getElementById('kpiOverlaps').textContent = stats.pendingOverlaps || 0;
    document.getElementById('kpiOverdue').textContent = stats.overdue || 0;
    document.getElementById('kpiDisposed').textContent = stats.disposed || 0;

    const banner = document.getElementById('benchmarkBanner');
    if (banner) {
      banner.style.display = (stats.total === 0) ? 'block' : 'none';
    }

    // Render Bureau Distribution
    const bureauContainer = document.getElementById('bureauDistContainer');
    if (bureauContainer) {
      const bCounts = stats.bureauCounts || {};
      const total = stats.total || 1;
      const bureauKeys = Object.keys(bCounts);

      if (!bureauKeys.length) {
        bureauContainer.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 1rem; font-size: 0.8rem;">No bureau cases recorded yet.</div>`;
      } else {
        bureauContainer.innerHTML = bureauKeys.map(code => {
          const count = bCounts[code];
          const pct = Math.round((count / total) * 100);
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.2rem;">
                <span style="font-weight: 600;">${code}</span>
                <span style="color: var(--color-text-muted);">${count} cases (${pct}%)</span>
              </div>
              <div style="height: 5px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                <div style="height: 100%; width: ${pct}%; background: var(--color-primary); border-radius: 9999px;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Ageing Breakdown
    const ageingContainer = document.getElementById('ageingDistContainer');
    if (ageingContainer) {
      const brackets = stats.ageingBrackets || { '0-7 days': 0, '8-15 days': 0, '16-30 days': 0, '>30 days': 0 };
      const openTotal = (stats.underProcess || 0) + (stats.received || 0) + (stats.assigned || 0) + (stats.pendingResponse || 0) || 1;

      ageingContainer.innerHTML = Object.entries(brackets).map(([bracket, count]) => {
        const pct = Math.round((count / openTotal) * 100);
        let color = '#10b981';
        if (bracket === '16-30 days') color = '#f59e0b';
        if (bracket === '>30 days') color = '#ef4444';

        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.2rem;">
              <span style="font-weight: 600;">${bracket}</span>
              <span style="color: var(--color-text-muted);">${count} open matters</span>
            </div>
            <div style="height: 5px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 9999px;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Recent Cases Table
    const tbody = document.getElementById('recentCasesTableBody');
    if (tbody) {
      const cases = casesRes.cases || [];
      if (!cases.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state" style="padding: 2rem 1rem;">
                <div class="empty-state-icon">
                  ${window.Icons?.fileText('w-5 h-5 text-slate-400') || ''}
                </div>
                <div class="empty-state-title">No Active Complaints Recorded</div>
                <div class="empty-state-desc">The docket register is currently clear. Click 'Register Complaint' to record an institutional inquiry.</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = cases.map(c => `
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
            <td style="font-size: 0.78rem;">${c.category}</td>
            <td><span class="badge ${window.CONFIG?.SEVERITY_BADGES[c.severity]?.class || 'badge-gray'}">${c.severity}</span></td>
            <td><span class="badge ${window.CONFIG?.STATUS_BADGES[c.status]?.class || 'badge-gray'}">${c.status}</span></td>
            <td style="font-size: 0.78rem;">
              ${c.isOverdue ? `<span style="color: var(--color-danger); font-weight: 700;">Overdue (${c.daysOverdue}d)</span>` : `<span style="color: #475569;">${c.daysRemaining}d remaining</span>`}
            </td>
            <td style="text-align: right;">
              <a href="#/cases/${c._id}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">Details →</a>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    window.Toast?.error('Failed fetching dashboard metrics: ' + err.message);
  }
}

window.renderDashboardPage = renderDashboardPage;
