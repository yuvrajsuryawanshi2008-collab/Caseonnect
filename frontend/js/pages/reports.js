/**
 * Reports & Regulatory Analytics Page Component
 */

async function renderReportsPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Reports & Regulatory Analytics
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          AICTE institutional compliance reporting, bureau disposal ratios, and exportable regulatory ledgers.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-secondary btn-sm" onclick="window.print()">
          ${window.Icons?.printer('w-3.5 h-3.5') || ''}
          <span>Printable Layout</span>
        </button>
        <a href="/api/reports/export/cases-csv" class="btn btn-primary btn-sm">
          ${window.Icons?.download('w-3.5 h-3.5') || ''}
          <span>Download Cases CSV</span>
        </a>
      </div>
    </div>

    <!-- Category Breakdown & Severity Matrix -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
      <!-- Category Breakdown Card -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 0.35rem;">Complaint Category Distribution</h3>
        <p class="card-desc" style="margin-bottom: 0.85rem;">Volume of cases classified across statutory grievance categories</p>
        <div id="reportCategoryContainer" style="display: flex; flex-direction: column; gap: 0.65rem;">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Severity & Ageing Performance -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom: 0.35rem;">Severity & SLA Ageing Distribution</h3>
        <p class="card-desc" style="margin-bottom: 0.85rem;">Risk profile of active institutional complaints</p>
        <div id="reportSeverityContainer" style="display: flex; flex-direction: column; gap: 0.65rem;">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>

    <!-- Regulatory Executive Summary Ledger -->
    <div class="card" style="padding: 1.25rem;">
      <h3 class="card-title" style="margin-bottom: 0.35rem;">Council Governance Summary</h3>
      <p class="card-desc" style="margin-bottom: 1rem;">Key performance indicators tracked across Regulation Bureau, PGRC, and regional jurisdictions</p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;" id="reportSummaryGrid">
        <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">Resolution Ratio</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-success); margin: 0.2rem 0;" id="metricResolutionRatio">0%</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">Proportion of formally disposed cases</div>
        </div>

        <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">Cross-Bureau Overlap Ratio</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-warning); margin: 0.2rem 0;" id="metricOverlapRatio">0%</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">Cases flagged for inter-bureau review</div>
        </div>

        <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">SLA Compliance Index</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-primary); margin: 0.2rem 0;" id="metricSlaIndex">100%</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">Cases resolved within standard timeframe</div>
        </div>
      </div>
    </div>
  `;

  loadReportsData();
}

async function loadReportsData() {
  try {
    const res = await window.API.get('/reports/dashboard-stats');
    const stats = res.stats || {};
    const total = stats.total || 0;

    const catContainer = document.getElementById('reportCategoryContainer');
    if (catContainer) {
      const categories = stats.categoryCounts || {};
      const catEntries = Object.entries(categories);

      if (!catEntries.length) {
        catContainer.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 1rem; font-size: 0.8rem;">No complaint categories recorded yet.</div>`;
      } else {
        catContainer.innerHTML = catEntries.map(([cat, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0;
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.2rem;">
                <span style="font-weight: 600;">${cat}</span>
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

    const sevContainer = document.getElementById('reportSeverityContainer');
    if (sevContainer) {
      const severities = stats.severityCounts || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      const sevColors = { LOW: '#94a3b8', MEDIUM: '#0284c7', HIGH: '#f59e0b', CRITICAL: '#ef4444' };

      sevContainer.innerHTML = Object.entries(severities).map(([sev, count]) => {
        const pct = total ? Math.round((count / total) * 100) : 0;
        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.2rem;">
              <span style="font-weight: 700; color: ${sevColors[sev]}; font-size: 0.72rem;">${sev} SEVERITY</span>
              <span style="color: var(--color-text-muted);">${count} matters (${pct}%)</span>
            </div>
            <div style="height: 5px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: ${sevColors[sev]}; border-radius: 9999px;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const disposed = stats.disposed || 0;
    const overdue = stats.overdue || 0;
    const overlaps = stats.pendingOverlaps || 0;

    const resRatio = total ? Math.round((disposed / total) * 100) : 0;
    const ovRatio = total ? Math.round((overlaps / total) * 100) : 0;
    const slaIndex = total ? Math.max(0, 100 - Math.round((overdue / total) * 100)) : 100;

    document.getElementById('metricResolutionRatio').textContent = `${resRatio}%`;
    document.getElementById('metricOverlapRatio').textContent = `${ovRatio}%`;
    document.getElementById('metricSlaIndex').textContent = `${slaIndex}%`;

  } catch (err) {
    window.Toast?.error('Failed loading reports: ' + err.message);
  }
}

window.renderReportsPage = renderReportsPage;
