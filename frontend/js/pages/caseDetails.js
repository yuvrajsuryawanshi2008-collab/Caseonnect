/**
 * Case Details & Interactive Chronological Timeline Page Component
 */

async function renderCaseDetailsPage(container, caseId) {
  container.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: var(--color-text-muted); font-size: 0.85rem;">
      Loading statutory case dossier...
    </div>
  `;

  try {
    const res = await window.API.get(`/cases/${caseId}`);
    const c = res.case;
    const inst = res.institution || {};
    const relatedCases = res.relatedCases || [];

    const isClosed = ['DISPOSED', 'CLOSED'].includes(c.status);

    container.innerHTML = `
      <!-- Breadcrumb & Top Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.2rem;">
            <a href="#/cases">Cases Register</a> / <span style="font-weight: 700; color: var(--color-text); font-family: monospace;">${c.caseNumber}</span>
          </div>
          <h1 style="font-size: 1.35rem; font-weight: 800; color: var(--color-text); display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.02em;">
            <span style="font-family: monospace;">${c.caseNumber}</span>
            <span class="badge ${window.CONFIG?.STATUS_BADGES[c.status]?.class || 'badge-gray'}">${c.status}</span>
            ${c.hasPotentialOverlap ? `<span class="badge badge-amber">Potential Overlap Flagged</span>` : ''}
          </h1>
        </div>

        <!-- Action Control Buttons -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" id="btnAssignOfficer">
            ${window.Icons?.users('w-3.5 h-3.5') || ''}
            <span>Assign Officer</span>
          </button>
          ${!isClosed ? `
            <button class="btn btn-secondary btn-sm" id="btnTransitionStatus">
              ${window.Icons?.refresh('w-3.5 h-3.5') || ''}
              <span>Update Status</span>
            </button>
            <button class="btn btn-danger btn-sm" id="btnOrderDisposal">
              ${window.Icons?.scale('w-3.5 h-3.5') || ''}
              <span>Formal Disposal</span>
            </button>
          ` : `
            <span class="badge badge-green" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
              Disposed on ${new Date(c.disposedDate || c.updatedAt).toLocaleDateString()}
            </span>
          `}
        </div>
      </div>

      <!-- Main Layout: 2 Columns (Dossier Facts + Chronological Timeline) -->
      <div style="display: grid; grid-template-columns: 2fr 1.3fr; gap: 1.25rem;">
        <!-- Left Column: Case Facts & Institution Details -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <!-- Primary Facts Card -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 0.65rem;">Complaint Allegation & Overview</h3>
            <div style="font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.65rem;">
              ${c.title}
            </div>
            <div style="font-size: 0.85rem; color: #334155; line-height: 1.55; background: #f8fafc; padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: 1rem;">
              ${c.description}
            </div>

            <!-- Metadata Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.85rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
              <div>
                <div class="form-label" style="font-size: 0.68rem; text-transform: uppercase;">Intake Bureau</div>
                <span class="badge badge-indigo">${c.bureauCode}</span>
              </div>
              <div>
                <div class="form-label" style="font-size: 0.68rem; text-transform: uppercase;">Grievance Category</div>
                <div style="font-weight: 600; font-size: 0.8rem;">${c.category}</div>
              </div>
              <div>
                <div class="form-label" style="font-size: 0.68rem; text-transform: uppercase;">Assigned Officer</div>
                <div style="font-weight: 600; font-size: 0.8rem;">${c.assignedOfficerName || 'Unassigned'}</div>
              </div>
              <div>
                <div class="form-label" style="font-size: 0.68rem; text-transform: uppercase;">Severity & Priority</div>
                <span class="badge ${window.CONFIG?.SEVERITY_BADGES[c.severity]?.class || 'badge-gray'}">${c.severity}</span>
                <span class="badge ${window.CONFIG?.PRIORITY_BADGES[c.priority]?.class || 'badge-gray'}">${c.priority}</span>
              </div>
              <div>
                <div class="form-label" style="font-size: 0.68rem; text-transform: uppercase;">Date Received</div>
                <div style="font-size: 0.8rem;">${new Date(c.receivedDate || c.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div class="form-label" style="font-size: 0.68rem; text-transform: uppercase;">SLA Resolution Target</div>
                <div style="font-size: 0.8rem; font-weight: 700; color: ${c.isOverdue ? 'var(--color-danger)' : 'var(--color-text)'};">
                  ${new Date(c.slaDeadline).toLocaleDateString()}
                  ${c.isOverdue ? ` (OVERDUE by ${c.daysOverdue}d)` : ` (${c.daysRemaining}d left)`}
                </div>
              </div>
            </div>

            <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 1px solid var(--color-border); font-size: 0.8rem;">
              <span style="font-weight: 700; color: #475569;">Next Required Regulatory Action:</span>
              <span style="color: var(--color-primary); font-weight: 600; margin-left: 0.35rem;">${c.nextRequiredAction || 'Under Scrutiny'}</span>
            </div>
          </div>

          <!-- Subject Institution Card -->
          <div class="card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem;">
              <h3 class="card-title">Subject Technical Institution</h3>
              <a href="#/institutions/${c.institutionId}" class="btn btn-secondary btn-sm">360° Profile →</a>
            </div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin-bottom: 0.2rem;">
              ${c.institutionName}
            </div>
            <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.65rem;">
              Statutory Permanent ID: <strong style="font-family: monospace;">${c.permanentId}</strong> • ${inst.city || ''}, ${inst.state || ''} (${inst.region || ''} Region)
            </div>
            <div style="font-size: 0.78rem; color: #475569;">
              Affiliation: <strong>${inst.affiliatedUniversity || 'Autonomous / State Board'}</strong> • Intake: <strong>${inst.approvedIntake || 'N/A'}</strong>
            </div>
          </div>

          <!-- Associated / Related Cases Card -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 0.35rem;">Associated & Related Cases</h3>
            <p class="card-desc" style="margin-bottom: 0.65rem;">Cases concerning this institution verified as related by authorized review.</p>
            ${!relatedCases.length ? `
              <div style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic;">
                No cross-referenced related cases linked to this docket record.
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                ${relatedCases.map(rc => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.65rem; background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
                    <div>
                      <a href="#/cases/${rc._id}" style="font-weight: 700; font-size: 0.82rem; font-family: monospace;">${rc.caseNumber}</a>
                      <span class="badge badge-indigo" style="margin-left: 0.35rem;">${rc.bureauCode}</span>
                      <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.1rem;">${rc.title}</div>
                    </div>
                    <span class="badge ${window.CONFIG?.STATUS_BADGES[rc.status]?.class || 'badge-gray'}">${rc.status}</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Internal Remarks Section -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 0.35rem;">Internal Regulatory Remarks & Hearing Notes</h3>
            <div id="internalRemarksContainer" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.85rem;">
              ${!c.internalRemarks || !c.internalRemarks.length ? `
                <div style="font-size: 0.78rem; color: var(--color-text-muted); font-style: italic;">
                  No confidential internal remarks recorded yet.
                </div>
              ` : c.internalRemarks.map(r => `
                <div style="background: #f8fafc; border-left: 3px solid var(--color-primary); padding: 0.55rem 0.75rem; border-radius: var(--radius-sm);">
                  <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: 0.15rem;">
                    <strong>${r.officerName} (${r.role})</strong>
                    <span>${new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #1e293b;">${r.comment}</div>
                </div>
              `).join('')}
            </div>

            <form id="addRemarkForm" style="display: flex; gap: 0.45rem;">
              <input type="text" class="form-control" id="newRemarkText" placeholder="Add confidential hearing note or internal directive..." required />
              <button type="submit" class="btn btn-secondary btn-sm" style="white-space: nowrap;">Record Note</button>
            </form>
          </div>
        </div>

        <!-- Right Column: Chronological Action Timeline -->
        <div>
          <div class="card" style="position: sticky; top: 76px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <h3 class="card-title" style="margin-bottom: 0;">Authorized Action Timeline</h3>
              <span class="badge badge-gray">${c.timeline?.length || 0} events</span>
            </div>

            <div style="position: relative; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 1rem; border-left: 2px solid var(--color-border); margin-left: 0.4rem;">
              ${(c.timeline || []).slice().reverse().map(t => `
                <div style="position: relative;">
                  <div style="position: absolute; left: -1.65rem; top: 0.15rem; width: 10px; height: 10px; border-radius: 9999px; background: var(--color-primary); border: 2px solid #ffffff; box-shadow: 0 0 0 2px var(--color-primary-light);"></div>
                  
                  <div style="font-weight: 700; font-size: 0.82rem; color: var(--color-text); line-height: 1.3;">
                    ${t.action}
                  </div>
                  <div style="font-size: 0.68rem; color: var(--color-text-muted); margin: 0.15rem 0 0.25rem;">
                    By <strong>${t.performedBy}</strong> (${t.role || 'Officer'}) • ${new Date(t.timestamp).toLocaleString()}
                  </div>
                  <div style="font-size: 0.78rem; color: #334155; background: #f8fafc; padding: 0.45rem 0.55rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                    ${t.remarks || 'Standard workflow progression recorded.'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnAssignOfficer')?.addEventListener('click', () => {
      window.Modals?.openAssignOfficerModal(caseId, () => renderCaseDetailsPage(container, caseId));
    });

    document.getElementById('btnTransitionStatus')?.addEventListener('click', () => {
      window.Modals?.openStatusModal(caseId, c.status, () => renderCaseDetailsPage(container, caseId));
    });

    document.getElementById('btnOrderDisposal')?.addEventListener('click', () => {
      window.Modals?.openDisposalModal(caseId, () => renderCaseDetailsPage(container, caseId));
    });

    document.getElementById('addRemarkForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('newRemarkText');
      const comment = input.value.trim();
      if (!comment) return;

      try {
        await window.API.post(`/cases/${caseId}/remarks`, { comment });
        window.Toast.success('Internal remark logged.');
        renderCaseDetailsPage(container, caseId);
      } catch (err) {
        window.Toast.error(err.message || 'Failed recording remark.');
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          ${window.Icons?.alertTriangle('w-5 h-5 text-red-500') || ''}
        </div>
        <div class="empty-state-title">Case Not Found</div>
        <div class="empty-state-desc">${err.message || 'The requested case dossier could not be retrieved.'}</div>
        <a href="#/cases" class="btn btn-primary btn-sm">Return to Cases Register</a>
      </div>
    `;
  }
}

window.renderCaseDetailsPage = renderCaseDetailsPage;
