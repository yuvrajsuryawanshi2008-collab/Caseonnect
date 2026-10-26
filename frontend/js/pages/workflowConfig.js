/**
 * Workflow & SLA Configuration Settings Page Component
 */

async function renderWorkflowConfigPage(container) {
  const iconSliders = window.Icons?.sliders || '';
  const iconShield = window.Icons?.shield || '';
  const iconCheck = window.Icons?.check || '';

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
        <span style="color: var(--color-primary); display: inline-flex;">${iconSliders}</span>
        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0;">Workflow & SLA Configuration</h1>
      </div>
      <p style="font-size: 0.88rem; color: var(--color-text-muted); margin: 0;">
        Configure statutory resolution deadlines by severity, alert intervals, and permissible status transitions.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
      <!-- SLA Deadline Rules Form -->
      <div class="card">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span style="color: var(--color-primary); display: inline-flex;">${iconSliders}</span>
          <h3 class="card-title" style="margin: 0;">Statutory SLA Resolution Deadlines</h3>
        </div>
        <p class="card-desc" style="margin-bottom: 1.25rem;">Default resolution window in days according to complaint severity assessment</p>

        <form id="slaConfigForm">
          <div class="form-group">
            <label class="form-label" for="slaCritical">Critical Severity SLA (Days)</label>
            <input type="number" class="form-control" id="slaCritical" value="7" min="1" max="90" required />
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.25rem;">Severe violations, safety, harassment, financial fraud</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="slaHigh">High Severity SLA (Days)</label>
            <input type="number" class="form-control" id="slaHigh" value="15" min="1" max="90" required />
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.25rem;">Withholding marksheets, unpaid salaries, intake irregularities</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="slaMedium">Medium Severity SLA (Days)</label>
            <input type="number" class="form-control" id="slaMedium" value="30" min="1" max="180" required />
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.25rem;">Standard administrative, curriculum, fee disputes</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="slaLow">Low Severity SLA (Days)</label>
            <input type="number" class="form-control" id="slaLow" value="45" min="1" max="180" required />
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 0.25rem;">General informational or advisory petitions</div>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 0.75rem;">
            ${iconCheck} Save SLA Configuration
          </button>
        </form>
      </div>

      <!-- State Invariant Rules Reference -->
      <div class="card">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span style="color: var(--color-primary); display: inline-flex;">${iconShield}</span>
          <h3 class="card-title" style="margin: 0;">Server-Enforced State Invariants</h3>
        </div>
        <p class="card-desc" style="margin-bottom: 1.25rem;">Valid status transitions strictly verified on every API request</p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.82rem;">
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <strong style="color: var(--color-primary); font-family: monospace;">RECEIVED</strong> → Assigned, Disposed
          </div>
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <strong style="color: var(--color-primary); font-family: monospace;">ASSIGNED</strong> → Under Process, Transferred, Disposed
          </div>
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <strong style="color: var(--color-primary); font-family: monospace;">UNDER PROCESS</strong> → Pending Response, Coordination Requested, Transferred, Escalated, Disposed
          </div>
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <strong style="color: var(--color-primary); font-family: monospace;">PENDING RESPONSE</strong> → Under Process, Escalated, Disposed
          </div>
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <strong style="color: var(--color-primary); font-family: monospace;">COORDINATION REQUESTED</strong> → Under Process, Disposed, Transferred
          </div>
          <div style="background: #f8fafc; padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <strong style="color: var(--color-primary); font-family: monospace;">DISPOSED</strong> → Closed, Reopened (Authorized Review Only)
          </div>
        </div>
      </div>
    </div>
  `;

  // Fetch current config
  try {
    const res = await window.API.get('/config/workflow');
    const sla = res.config?.slaDays || {};
    if (sla.CRITICAL) document.getElementById('slaCritical').value = sla.CRITICAL;
    if (sla.HIGH) document.getElementById('slaHigh').value = sla.HIGH;
    if (sla.MEDIUM) document.getElementById('slaMedium').value = sla.MEDIUM;
    if (sla.LOW) document.getElementById('slaLow').value = sla.LOW;
  } catch (e) {
    // Keep defaults
  }

  document.getElementById('slaConfigForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slaDays = {
      CRITICAL: parseInt(document.getElementById('slaCritical').value, 10),
      HIGH: parseInt(document.getElementById('slaHigh').value, 10),
      MEDIUM: parseInt(document.getElementById('slaMedium').value, 10),
      LOW: parseInt(document.getElementById('slaLow').value, 10)
    };

    try {
      await window.API.put('/config/workflow', { slaDays });
      window.Toast.success('Workflow SLA parameters saved successfully.');
    } catch (err) {
      window.Toast.error(err.message || 'Failed saving configuration.');
    }
  });
}

window.renderWorkflowConfigPage = renderWorkflowConfigPage;
