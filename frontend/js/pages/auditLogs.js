/**
 * Immutable Audit Logs Page Component
 */

async function renderAuditLogsPage(container) {
  const iconShield = window.Icons?.shield || '';
  const iconRefresh = window.Icons?.refresh || '';

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span style="color: var(--color-primary); display: inline-flex;">${iconShield}</span>
          <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0;">Immutable Security Audit Log</h1>
        </div>
        <p style="font-size: 0.88rem; color: var(--color-text-muted); margin: 0;">
          Cryptographic ledger capturing all case modifications, status transitions, user logins, and access events.
        </p>
      </div>

      <button class="btn btn-secondary btn-sm" onclick="loadAuditLogsData()">
        ${iconRefresh}
        <span>Refresh Audit Stream</span>
      </button>
    </div>

    <!-- Audit Logs Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Acting Official</th>
              <th>Role</th>
              <th>Action / Event</th>
              <th>Target Entity</th>
              <th>IP Address</th>
              <th>Event Details</th>
            </tr>
          </thead>
          <tbody id="auditTableBody">
            <tr>
              <td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 2.5rem;">
                Loading audit events...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadAuditLogsData();
}

async function loadAuditLogsData() {
  try {
    const res = await window.API.get('/audit', { limit: 50 });
    const logs = res.logs || [];
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (!logs.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-state-icon" style="color: var(--color-text-muted);">${window.Icons?.scroll || ''}</div>
              <div class="empty-state-title">No Audit Logs Found</div>
              <div class="empty-state-desc">Immutable audit entries will appear here as system actions occur.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="font-size: 0.78rem; font-family: monospace; white-space: nowrap;">
          ${new Date(l.timestamp).toLocaleString()}
        </td>
        <td>
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-text);">${l.userName || 'System'}</div>
          <div style="font-size: 0.72rem; color: var(--color-text-muted);">${l.userEmail || ''}</div>
        </td>
        <td><span class="badge badge-gray">${l.userRole || 'SYSTEM'}</span></td>
        <td><span class="badge badge-indigo" style="font-family: monospace;">${l.action}</span></td>
        <td style="font-size: 0.82rem; font-family: monospace;">${l.entityType} (${l.entityId})</td>
        <td style="font-size: 0.75rem; font-family: monospace; color: var(--color-text-muted);">${l.ipAddress || '127.0.0.1'}</td>
        <td style="font-size: 0.82rem; color: #334155; max-width: 320px; line-height: 1.4;">
          ${l.details || '—'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    window.Toast.error('Failed loading audit logs: ' + err.message);
  }
}

window.renderAuditLogsPage = renderAuditLogsPage;
window.loadAuditLogsData = loadAuditLogsData;
