/**
 * Cross-Bureau Overlap Detection & Review Engine Page Component (Core Problem Statement Feature)
 */

async function renderOverlapsPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Cross-Bureau Overlap Detection & Review
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Layered explainable heuristic matching identifying related complaints handled across different regulatory bureaus concerning the same institution.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-secondary btn-sm" onclick="fetchAndRenderOverlaps()">
          ${window.Icons?.refresh('w-3.5 h-3.5') || ''}
          <span>Refresh Candidates</span>
        </button>
      </div>
    </div>

    <!-- Alert / Safeguard Banner -->
    <div class="card" style="background: #fffbeb; border-color: #fde68a; padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="color: #b45309; flex-shrink: 0; margin-top: 0.1rem;">
          ${window.Icons?.alertTriangle('w-4 h-4') || ''}
        </div>
        <div>
          <div style="font-weight: 700; font-size: 0.85rem; color: #92400e; margin-bottom: 0.2rem;">
            Regulatory Safeguard Notice: Zero Auto-Merge Policy
          </div>
          <div style="font-size: 0.78rem; color: #78350f; line-height: 1.45;">
            The Council monitoring system <strong>never automatically merges, transfers, or closes cases</strong> based on similarity scores. Different complaints against the same institution may address legitimate separate statutory matters. Every match requires authorized human adjudication before recording relations or joint coordination.
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs (Pending Review vs Adjudicated) -->
    <div style="display: flex; gap: 0.45rem; margin-bottom: 1rem;">
      <button class="btn btn-primary btn-sm" id="tabPendingOverlaps">
        Pending Human Review
      </button>
      <button class="btn btn-secondary btn-sm" id="tabAdjudicatedOverlaps">
        Adjudicated / Reviewed
      </button>
    </div>

    <!-- Overlaps List Container -->
    <div id="overlapsListContainer" style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="text-align: center; color: var(--color-text-muted); padding: 2.5rem; font-size: 0.85rem;">
        Loading overlap candidates...
      </div>
    </div>
  `;

  let currentStatus = 'PENDING_REVIEW';

  document.getElementById('tabPendingOverlaps')?.addEventListener('click', (e) => {
    currentStatus = 'PENDING_REVIEW';
    e.target.className = 'btn btn-primary btn-sm';
    document.getElementById('tabAdjudicatedOverlaps').className = 'btn btn-secondary btn-sm';
    fetchAndRenderOverlaps(currentStatus);
  });

  document.getElementById('tabAdjudicatedOverlaps')?.addEventListener('click', (e) => {
    currentStatus = 'ALL_REVIEWED';
    e.target.className = 'btn btn-primary btn-sm';
    document.getElementById('tabPendingOverlaps').className = 'btn btn-secondary btn-sm';
    fetchAndRenderOverlaps(currentStatus);
  });

  fetchAndRenderOverlaps(currentStatus);
}

async function fetchAndRenderOverlaps(statusFilter = 'PENDING_REVIEW') {
  const container = document.getElementById('overlapsListContainer');
  if (!container) return;

  try {
    const res = await window.API.get('/overlaps');
    let overlaps = res.overlaps || [];

    if (statusFilter === 'PENDING_REVIEW') {
      overlaps = overlaps.filter(o => o.status === 'PENDING_REVIEW');
    } else {
      overlaps = overlaps.filter(o => o.status !== 'PENDING_REVIEW');
    }

    if (!overlaps.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            ${window.Icons?.checkCircle('w-5 h-5 text-emerald-600') || ''}
          </div>
          <div class="empty-state-title">${statusFilter === 'PENDING_REVIEW' ? 'No Pending Overlaps Requiring Review' : 'No Reviewed History Found'}</div>
          <div class="empty-state-desc">
            ${statusFilter === 'PENDING_REVIEW' 
              ? 'All cross-bureau complaint records are currently distinct or have already been reviewed by authorized officials.' 
              : 'Adjudicated overlap records will appear here once reviewed.'}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = overlaps.map(o => `
      <div class="card" style="border-left: 4px solid ${o.confidenceScore >= 70 ? 'var(--color-danger)' : 'var(--color-warning)'}; padding: 1.15rem;">
        <!-- Top Match Info -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.65rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.65rem;">
          <div>
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--color-text);">
              Potential Overlapping Cases — Coordination Assessment
            </div>
            <div style="font-size: 0.78rem; color: var(--color-text-muted);">
              Technical Institution: <strong>${o.institutionName}</strong> (ID: <span style="font-family: monospace;">${o.permanentId}</span>)
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="text-align: right;">
              <div style="font-size: 0.65rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">Confidence</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: ${o.confidenceScore >= 70 ? 'var(--color-danger)' : 'var(--color-warning)'};">
                ${o.confidenceScore}%
              </div>
            </div>
            <span class="badge ${o.status === 'PENDING_REVIEW' ? 'badge-amber' : 'badge-green'}">
              ${o.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <!-- Side-by-Side Comparison Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <!-- Docket Case A -->
          <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span class="badge badge-indigo">Bureau: ${o.caseABureau}</span>
              <a href="#/cases/${o.caseAId}" style="font-weight: 700; font-size: 0.82rem; font-family: monospace;">${o.caseANumber} →</a>
            </div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.35rem; line-height: 1.35;">
              ${o.caseATitle || 'Case Title Unavailable'}
            </div>
            <div style="font-size: 0.72rem; color: var(--color-text-muted);">
              Assigned Officer: <strong>${o.caseAOfficer || 'Unassigned'}</strong>
            </div>
          </div>

          <!-- Docket Case B -->
          <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
              <span class="badge badge-purple">Bureau: ${o.caseBBureau}</span>
              <a href="#/cases/${o.caseBId}" style="font-weight: 700; font-size: 0.82rem; font-family: monospace;">${o.caseBNumber} →</a>
            </div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.35rem; line-height: 1.35;">
              ${o.caseBTitle || 'Case Title Unavailable'}
            </div>
            <div style="font-size: 0.72rem; color: var(--color-text-muted);">
              Assigned Officer: <strong>${o.caseBOfficer || 'Unassigned'}</strong>
            </div>
          </div>
        </div>

        <!-- Explainable Matching Rules & Matched Tokens -->
        <div style="background: #f1f5f9; padding: 0.75rem 0.85rem; border-radius: var(--radius-md); font-size: 0.78rem; margin-bottom: 0.85rem;">
          <div style="font-weight: 700; color: #334155; margin-bottom: 0.25rem;">Layered Heuristic Explanation:</div>
          <div style="color: #475569; line-height: 1.45; margin-bottom: 0.35rem;">
            ${o.explanation}
          </div>
          ${o.matchingTokens && o.matchingTokens.length ? `
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
              <span style="font-weight: 600; color: #475569;">Overlapping Allegation Keywords:</span>
              ${o.matchingTokens.map(t => `<span class="badge badge-gray" style="font-family: monospace; font-size: 0.65rem;">${t}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Adjudication Action Controls (If Pending) -->
        ${o.status === 'PENDING_REVIEW' ? `
          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.6rem; border-top: 1px solid var(--color-border); padding-top: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="adjudicateOverlap('${o._id}', 'DISMISSED_UNRELATED')">
              ${window.Icons?.x('w-3.5 h-3.5') || ''}
              <span>Mark as Unrelated</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="adjudicateOverlap('${o._id}', 'CONFIRMED_RELATED')">
              ${window.Icons?.check('w-3.5 h-3.5') || ''}
              <span>Confirm Related Cases</span>
            </button>
            <button class="btn btn-primary btn-sm" onclick="adjudicateOverlap('${o._id}', 'COORDINATION_INITIATED')">
              ${window.Icons?.gitMerge('w-3.5 h-3.5') || ''}
              <span>Initiate Cross-Bureau Coordination</span>
            </button>
          </div>
        ` : `
          <div style="border-top: 1px solid var(--color-border); padding-top: 0.65rem; font-size: 0.75rem; color: var(--color-text-muted); display: flex; justify-content: space-between;">
            <div>
              Reviewed by <strong>${o.reviewerName || 'Authorized Reviewer'}</strong> (${o.reviewerRole || 'Official'}) on ${new Date(o.reviewedAt).toLocaleDateString()}
            </div>
            <div>
              Notes: <em>${o.reviewerNotes || 'None'}</em>
            </div>
          </div>
        `}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 2rem; font-size: 0.8rem;">Error loading overlaps: ${err.message}</div>`;
  }
}

async function adjudicateOverlap(overlapId, determination) {
  const notes = prompt(`Please enter official justification notes for determination (${determination}):`);
  if (notes === null) return;

  try {
    await window.API.post(`/overlaps/${overlapId}/review`, {
      determination,
      reviewerNotes: notes || 'Reviewed according to statutory procedure.'
    });
    window.Toast.success(`Review determination recorded: ${determination.replace(/_/g, ' ')}`);
    fetchAndRenderOverlaps();
  } catch (err) {
    window.Toast.error(err.message || 'Adjudication failed.');
  }
}

window.renderOverlapsPage = renderOverlapsPage;
window.fetchAndRenderOverlaps = fetchAndRenderOverlaps;
window.adjudicateOverlap = adjudicateOverlap;
