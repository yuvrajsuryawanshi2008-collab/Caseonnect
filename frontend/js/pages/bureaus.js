/**
 * Bureaus & Regulatory Cells Management Page Component
 */

async function renderBureausPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Council Bureaus & Grievance Cells
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Operational jurisdictions, officer rosters, workload capacity, and inter-bureau coordination dockets.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-primary btn-sm" id="btnInitiateCoordination">
          ${window.Icons?.gitMerge('w-3.5 h-3.5') || ''}
          <span>Initiate Joint Bureau Coordination</span>
        </button>
      </div>
    </div>

    <!-- Bureaus Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;" id="bureausCardsGrid">
      <div style="text-align: center; color: var(--color-text-muted); padding: 2rem; grid-column: 1 / -1; font-size: 0.85rem;">
        Loading regulatory bureaus directory...
      </div>
    </div>

    <!-- Active Coordination Dockets -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h3 class="card-title" style="margin-bottom: 0.15rem;">Active Cross-Bureau Coordination Dockets</h3>
          <p class="card-desc">Formal joint inquiries and synchronized regulatory notices between Bureaus</p>
        </div>
      </div>

      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Docket Subject</th>
              <th>Initiating Bureau</th>
              <th>Partner Bureau</th>
              <th>Primary Case</th>
              <th>Institution</th>
              <th>Status</th>
              <th>Date Requested</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="coordinationTableBody">
            <tr>
              <td colspan="8" style="text-align: center; color: var(--color-text-muted); padding: 2rem;">
                Loading coordination dockets...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnInitiateCoordination')?.addEventListener('click', () => {
    openJointCoordinationModal();
  });

  loadBureausData();
}

async function loadBureausData() {
  try {
    const [burRes, coordRes] = await Promise.all([
      window.API.get('/bureaus'),
      window.API.get('/bureaus/coordination')
    ]);

    const bureaus = burRes.bureaus || [];
    const coordinations = coordRes.coordinationRequests || [];

    const grid = document.getElementById('bureausCardsGrid');
    if (grid) {
      grid.innerHTML = bureaus.map(b => `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem;">
              <span class="badge badge-indigo" style="font-size: 0.8rem; font-weight: 800;">${b.code}</span>
              <span class="badge ${b.overdueCases > 0 ? 'badge-red' : 'badge-green'}">
                ${b.overdueCases} Overdue
              </span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--color-text); margin-bottom: 0.25rem;">
              ${b.name}
            </h3>
            <p style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.45; margin-bottom: 0.85rem;">
              ${b.description || 'Regulatory compliance and institutional monitoring unit.'}
            </p>

            <div style="background: #f8fafc; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 0.85rem; font-size: 0.78rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                <span style="color: var(--color-text-muted);">Head Officer:</span>
                <strong>${b.headOfficerName || 'Bureau Director'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-muted);">Active Staff Roster:</span>
                <strong>${b.officerCount || 1} Officers</strong>
              </div>
            </div>
          </div>

          <div>
            <div style="margin-bottom: 0.65rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 0.2rem;">
                <span>Active Workload (${b.openCases} / ${b.capacityLimit || 100})</span>
                <span>${b.saturationPercent}% capacity</span>
              </div>
              <div style="height: 5px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                <div style="height: 100%; width: ${Math.min(100, b.saturationPercent)}%; background: ${b.saturationPercent > 80 ? 'var(--color-danger)' : 'var(--color-primary)'}; border-radius: 9999px;"></div>
              </div>
            </div>

            <a href="#/cases?bureauCode=${b.code}" class="btn btn-secondary btn-sm btn-full">
              View Cases (${b.totalCases}) →
            </a>
          </div>
        </div>
      `).join('');
    }

    const tbody = document.getElementById('coordinationTableBody');
    if (tbody) {
      if (!coordinations.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state" style="padding: 2rem 1rem;">
                <div class="empty-state-icon">
                  ${window.Icons?.gitMerge('w-5 h-5 text-slate-400') || ''}
                </div>
                <div class="empty-state-title">No Active Joint Coordination Dockets</div>
                <div class="empty-state-desc">When multi-bureau cases require shared inquiry, joint coordination dockets will appear here.</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = coordinations.map(c => `
          <tr>
            <td>
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--color-text);">${c.subject}</div>
              <div style="font-size: 0.7rem; color: var(--color-text-muted);">${c.justification}</div>
            </td>
            <td><span class="badge badge-indigo">${c.requestingBureauCode}</span></td>
            <td><span class="badge badge-purple">${c.targetBureauCode}</span></td>
            <td>
              <a href="#/cases/${c.primaryCaseId}" style="font-weight: 700; color: var(--color-primary); font-family: monospace;">
                ${c.primaryCaseNumber}
              </a>
            </td>
            <td style="font-size: 0.8rem; font-weight: 600;">${c.institutionName}</td>
            <td>
              <span class="badge ${c.status === 'RESOLVED' ? 'badge-green' : 'badge-amber'}">${c.status}</span>
            </td>
            <td style="font-size: 0.78rem;">${new Date(c.createdAt).toLocaleDateString()}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm" onclick="alert('Coordination Notes:\\n\\n' + JSON.stringify(${JSON.stringify(c.jointActionNotes || [])}, null, 2))">
                Notes (${c.jointActionNotes?.length || 0})
              </button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    window.Toast?.error('Failed loading bureau data: ' + err.message);
  }
}

async function openJointCoordinationModal() {
  let cases = [];
  try {
    const res = await window.API.get('/cases', { limit: 50 });
    cases = res.cases || [];
  } catch (e) {
    cases = [];
  }

  window.Modals.ensureContainer();
  window.Modals.container.innerHTML = `
    <div class="modal-overlay active" id="jointCoordModalOverlay">
      <div class="modal-container" style="max-width: 580px;">
        <div class="modal-header">
          <div class="modal-title">Initiate Joint Cross-Bureau Coordination</div>
          <button class="modal-close-btn" onclick="window.Modals.closeAll()">
            ${window.Icons?.x('w-4 h-4') || '✕'}
          </button>
        </div>
        <div class="modal-body">
          <form id="jointCoordForm">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="coordReqBureau">Initiating Bureau *</label>
                <select class="form-control" id="coordReqBureau" required>
                  <option value="RB">RB - Regulation Bureau</option>
                  <option value="PGRC">PGRC - Public Grievance</option>
                  <option value="AB">AB - Approval Bureau</option>
                  <option value="VIGILANCE">Vigilance Cell</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="coordTargetBureau">Target Partner Bureau *</label>
                <select class="form-control" id="coordTargetBureau" required>
                  <option value="PGRC">PGRC - Public Grievance</option>
                  <option value="RB">RB - Regulation Bureau</option>
                  <option value="AB">AB - Approval Bureau</option>
                  <option value="PAPB">PAPB - Policy Bureau</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="coordPrimaryCase">Primary Docket Case *</label>
              <select class="form-control" id="coordPrimaryCase" required>
                <option value="">-- Select Case to Coordinate --</option>
                ${cases.map(c => `
                  <option value="${c._id}" data-number="${c.caseNumber}" data-inst="${c.institutionName}">
                    [${c.caseNumber}] ${c.title.substring(0, 45)}... (${c.institutionName})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="coordSubject">Joint Coordination Subject *</label>
              <input type="text" class="form-control" id="coordSubject" placeholder="e.g. Aligned hearing on faculty salary arrears and cadre standards" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="coordJustification">Coordination Justification & Scope *</label>
              <textarea class="form-control" id="coordJustification" rows="3" placeholder="Explain why shared visibility and synchronized deadlines are required..." required></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
              <button type="button" class="btn btn-secondary" onclick="window.Modals.closeAll()">Cancel</button>
              <button type="submit" class="btn btn-primary">Dispatch Coordination Request</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('jointCoordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caseSelect = document.getElementById('coordPrimaryCase');
    const selectedOpt = caseSelect.options[caseSelect.selectedIndex];

    const body = {
      requestingBureauCode: document.getElementById('coordReqBureau').value,
      targetBureauCode: document.getElementById('coordTargetBureau').value,
      primaryCaseId: caseSelect.value,
      primaryCaseNumber: selectedOpt.getAttribute('data-number'),
      institutionName: selectedOpt.getAttribute('data-inst'),
      subject: document.getElementById('coordSubject').value.trim(),
      justification: document.getElementById('coordJustification').value.trim()
    };

    try {
      await window.API.post('/bureaus/coordination', body);
      window.Toast.success('Cross-Bureau coordination docket created.');
      window.Modals.closeAll();
      window.dispatchEvent(new Event('hashchange'));
    } catch (err) {
      window.Toast.error(err.message || 'Coordination request failed.');
    }
  });
}

window.renderBureausPage = renderBureausPage;
