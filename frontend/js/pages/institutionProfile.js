/**
 * Institution 360° Profile Page Component
 */

async function renderInstitutionProfilePage(container, institutionId) {
  container.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: var(--color-text-muted); font-size: 0.85rem;">
      Loading Institution 360° Consolidated Profile...
    </div>
  `;

  try {
    const res = await window.API.get(`/institutions/${institutionId}/profile-360`);
    const inst = res.institution;
    const metrics = res.metrics;
    const cases = res.cases || [];

    let riskBadgeColor = 'badge-green';
    if (inst.riskLevel?.includes('CRITICAL')) riskBadgeColor = 'badge-red';
    else if (inst.riskLevel?.includes('ELEVATED')) riskBadgeColor = 'badge-amber';

    container.innerHTML = `
      <!-- Breadcrumb & Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.2rem;">
            <a href="#/institutions">Institutions Directory</a> / <span style="font-weight: 700; color: var(--color-text);">360° Profile</span>
          </div>
          <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
            ${inst.name}
          </h1>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.15rem;">
            Statutory Permanent ID: <strong style="font-family: monospace;">${inst.permanentId}</strong> • ${inst.city}, ${inst.state} (${inst.region} Region)
          </div>
        </div>

        <div style="display: flex; gap: 0.6rem;">
          <button class="btn btn-primary btn-sm" id="btnRegisterForThisInst">
            ${window.Icons?.plus('w-3.5 h-3.5') || ''}
            <span>Register Case for this Institution</span>
          </button>
        </div>
      </div>

      <!-- Risk & Case Summary Strip -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        <div class="kpi-card">
          <div>
            <div class="kpi-val">${metrics.totalCases}</div>
            <div class="kpi-label">Lifetime Cases</div>
          </div>
          <div class="kpi-icon-box" style="background: #eef2ff; color: #4338ca;">
            ${window.Icons?.fileText('w-4 h-4') || ''}
          </div>
        </div>

        <div class="kpi-card">
          <div>
            <div class="kpi-val" style="color: var(--color-warning);">${metrics.openCases}</div>
            <div class="kpi-label">Active / Open Inquiries</div>
          </div>
          <div class="kpi-icon-box" style="background: #fffbeb; color: #b45309;">
            ${window.Icons?.clock('w-4 h-4') || ''}
          </div>
        </div>

        <div class="kpi-card">
          <div>
            <div class="kpi-val" style="color: var(--color-danger);">${metrics.overdueCases}</div>
            <div class="kpi-label">SLA Overdue</div>
          </div>
          <div class="kpi-icon-box" style="background: #fee2e2; color: #b91c1c;">
            ${window.Icons?.alertTriangle('w-4 h-4') || ''}
          </div>
        </div>

        <div class="kpi-card">
          <div>
            <div class="kpi-val">${inst.approvedIntake || 'N/A'}</div>
            <div class="kpi-label">Sanctioned Intake</div>
          </div>
          <div class="kpi-icon-box" style="background: #f1f5f9; color: #475569;">
            ${window.Icons?.building('w-4 h-4') || ''}
          </div>
        </div>

        <div class="kpi-card" style="border: 1px solid ${inst.riskScore >= 70 ? '#fca5a5' : '#e2e8f0'};">
          <div>
            <div style="margin-bottom: 0.2rem;">
              <span class="badge ${riskBadgeColor}">${inst.riskLevel}</span>
            </div>
            <div class="kpi-label">Compliance Scrutiny Score: ${inst.riskScore}/100</div>
          </div>
          <div class="kpi-icon-box" style="background: #f1f5f9; color: #475569;">
            ${window.Icons?.shield('w-4 h-4') || ''}
          </div>
        </div>
      </div>

      <!-- Institution Profile Specs & Bureau Breakdown Grid -->
      <div style="display: grid; grid-template-columns: 1.2fr 2fr; gap: 1.25rem; margin-bottom: 1.25rem;">
        <!-- Institutional Record Card -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 0.65rem;">Statutory Record</h3>
          <div style="display: flex; flex-direction: column; gap: 0.55rem; font-size: 0.8rem;">
            <div>
              <span style="color: var(--color-text-muted); display: block; font-size: 0.68rem; text-transform: uppercase;">Legal Name:</span>
              <strong>${inst.name}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted); display: block; font-size: 0.68rem; text-transform: uppercase;">Permanent ID:</span>
              <strong style="font-family: monospace;">${inst.permanentId}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted); display: block; font-size: 0.68rem; text-transform: uppercase;">Affiliated University:</span>
              <strong>${inst.affiliatedUniversity || 'Autonomous / State Board'}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted); display: block; font-size: 0.68rem; text-transform: uppercase;">Principal / Director:</span>
              <strong>${inst.principalName || 'Institutional Head'}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted); display: block; font-size: 0.68rem; text-transform: uppercase;">Campus Location:</span>
              <strong>${inst.address || inst.city}, ${inst.city}, ${inst.state} - ${inst.pincode || ''}</strong>
            </div>
            <div>
              <span style="color: var(--color-text-muted); display: block; font-size: 0.68rem; text-transform: uppercase;">Contact Email:</span>
              <strong>${inst.contactEmail || 'registrar@institution.edu.in'}</strong>
            </div>
          </div>
        </div>

        <!-- Cross-Bureau Breakdown -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom: 0.35rem;">Cross-Bureau Case Jurisdiction Breakdown</h3>
          <p class="card-desc" style="margin-bottom: 0.85rem;">All historical and active matters filed against this institution across AICTE bureaus.</p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 0.65rem; margin-bottom: 0.85rem;">
            ${Object.entries(metrics.bureauBreakdown || {}).map(([bureau, count]) => `
              <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.65rem; text-align: center;">
                <div style="font-weight: 800; font-size: 1.2rem; color: var(--color-primary);">${count}</div>
                <div style="font-size: 0.72rem; font-weight: 600; color: #475569; margin-top: 0.15rem;">${bureau} Bureau</div>
              </div>
            `).join('')}
            ${!Object.keys(metrics.bureauBreakdown || {}).length ? `
              <div style="color: var(--color-text-muted); font-style: italic; padding: 0.75rem 0; font-size: 0.8rem;">No bureau records logged.</div>
            ` : ''}
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: 0.65rem; font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.45;">
            <strong>Institutional Oversight Notice</strong>: This consolidated cross-bureau dossier prevents conflicting directives being dispatched to the institution from AICTE Regulation Bureau and PGRC.
          </div>
        </div>
      </div>

      <!-- Unified Cases Ledger Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h3 class="card-title" style="margin-bottom: 0.15rem;">Unified Case Ledger (${cases.length})</h3>
            <p class="card-desc">Chronological register of all complaints, inquiries, and regulatory inspections</p>
          </div>
        </div>

        <div class="data-table-wrapper" style="border: none; border-radius: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Bureau</th>
                <th>Allegation / Subject</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Officer</th>
                <th>Date Received</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${!cases.length ? `
                <tr>
                  <td colspan="8">
                    <div class="empty-state" style="padding: 2.25rem 1rem;">
                      <div class="empty-state-icon">
                        ${window.Icons?.checkCircle('w-5 h-5 text-emerald-600') || ''}
                      </div>
                      <div class="empty-state-title">No Complaints on Record</div>
                      <div class="empty-state-desc">This technical institution has a clean regulatory record with zero active or historical cases.</div>
                    </div>
                  </td>
                </tr>
              ` : cases.map(c => `
                <tr>
                  <td>
                    <a href="#/cases/${c._id}" style="font-weight: 700; color: var(--color-primary); font-family: monospace;">
                      ${c.caseNumber}
                    </a>
                  </td>
                  <td><span class="badge badge-indigo">${c.bureauCode}</span></td>
                  <td>
                    <div style="font-weight: 600; font-size: 0.82rem; max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.title}">
                      ${c.title}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">${c.category}</div>
                  </td>
                  <td><span class="badge ${window.CONFIG?.SEVERITY_BADGES[c.severity]?.class || 'badge-gray'}">${c.severity}</span></td>
                  <td><span class="badge ${window.CONFIG?.STATUS_BADGES[c.status]?.class || 'badge-gray'}">${c.status}</span></td>
                  <td style="font-size: 0.78rem;">${c.assignedOfficerName || 'Unassigned'}</td>
                  <td style="font-size: 0.78rem;">${new Date(c.receivedDate || c.createdAt).toLocaleDateString()}</td>
                  <td style="text-align: right;">
                    <a href="#/cases/${c._id}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;">
                      View Dossier →
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btnRegisterForThisInst')?.addEventListener('click', () => {
      window.Modals?.openRegisterCaseModal(institutionId);
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          ${window.Icons?.alertTriangle('w-5 h-5 text-red-500') || ''}
        </div>
        <div class="empty-state-title">Institution Profile Unavailable</div>
        <div class="empty-state-desc">${err.message || 'Unable to load consolidated institution profile.'}</div>
        <a href="#/institutions" class="btn btn-primary btn-sm">Return to Institutions Directory</a>
      </div>
    `;
  }
}

window.renderInstitutionProfilePage = renderInstitutionProfilePage;
