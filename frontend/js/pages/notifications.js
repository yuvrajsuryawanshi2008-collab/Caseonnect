/**
 * Notifications & Alert Center Page Component
 */

async function renderNotificationsPage(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
          Notifications & Regulatory Alerts
        </h1>
        <p style="font-size: 0.8rem; color: var(--color-text-muted);">
          Automated SLA alerts, cross-bureau overlap detections, case assignments, and coordination requests.
        </p>
      </div>

      <div style="display: flex; gap: 0.6rem;">
        <button class="btn btn-secondary btn-sm" id="btnMarkAllRead">
          ${window.Icons?.check('w-3.5 h-3.5') || ''}
          <span>Mark All as Read</span>
        </button>
      </div>
    </div>

    <!-- Notification Cards List -->
    <div id="notificationsContainer" style="display: flex; flex-direction: column; gap: 0.75rem;">
      <div style="text-align: center; color: var(--color-text-muted); padding: 2.5rem; font-size: 0.85rem;">
        Loading notifications...
      </div>
    </div>
  `;

  document.getElementById('btnMarkAllRead')?.addEventListener('click', async () => {
    try {
      await window.API.put('/notifications/read-all');
      window.Toast?.success('All notifications marked as read.');
      loadNotificationsList();
      window.updateNotificationBadge?.();
    } catch (e) {
      window.Toast?.error(e.message);
    }
  });

  loadNotificationsList();
}

async function loadNotificationsList() {
  const container = document.getElementById('notificationsContainer');
  if (!container) return;

  try {
    const res = await window.API.get('/notifications');
    const items = res.notifications || [];

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            ${window.Icons?.bell('w-5 h-5 text-slate-400') || ''}
          </div>
          <div class="empty-state-title">Notification Queue Clear</div>
          <div class="empty-state-desc">No new alerts or pending regulatory notifications at this time.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(n => {
      let iconSvg = window.Icons?.bell('w-4 h-4 text-indigo-600') || '';
      let border = 'var(--color-primary)';
      if (n.type === 'OVERLAP_ALERT') {
        iconSvg = window.Icons?.gitMerge('w-4 h-4 text-amber-600') || '';
        border = 'var(--color-warning)';
      } else if (n.type === 'OVERDUE_ALERT') {
        iconSvg = window.Icons?.alertTriangle('w-4 h-4 text-red-600') || '';
        border = 'var(--color-danger)';
      } else if (n.type === 'COORDINATION_NOTE') {
        iconSvg = window.Icons?.building2('w-4 h-4 text-purple-600') || '';
        border = 'var(--color-purple)';
      }

      return `
        <div class="card" style="padding: 0.85rem 1.15rem; border-left: 3px solid ${border}; background: ${n.isRead ? '#ffffff' : '#f8fafc'};">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.85rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
              <div style="margin-top: 0.15rem; flex-shrink: 0;">${iconSvg}</div>
              <div>
                <div style="font-weight: 700; font-size: 0.88rem; color: var(--color-text); margin-bottom: 0.15rem;">
                  ${n.title}
                  ${!n.isRead ? `<span class="badge badge-amber" style="margin-left: 0.35rem; font-size: 0.6rem;">NEW</span>` : ''}
                </div>
                <div style="font-size: 0.8rem; color: #334155; line-height: 1.4; margin-bottom: 0.35rem;">
                  ${n.message}
                </div>
                <div style="font-size: 0.68rem; color: var(--color-text-muted);">
                  ${new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
              ${n.linkUrl ? `
                <a href="#${n.linkUrl}" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem;" onclick="markNotificationRead('${n._id}')">
                  View →
                </a>
              ` : ''}
              ${!n.isRead ? `
                <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.45rem;" onclick="markNotificationRead('${n._id}')" title="Mark as read">
                  ${window.Icons?.check('w-3.5 h-3.5') || '✓'}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 2rem; font-size: 0.8rem;">Failed loading notifications: ${err.message}</div>`;
  }
}

async function markNotificationRead(id) {
  try {
    await window.API.put(`/notifications/${id}/read`);
    loadNotificationsList();
    window.updateNotificationBadge?.();
  } catch (e) {
    // Ignore
  }
}

window.renderNotificationsPage = renderNotificationsPage;
window.markNotificationRead = markNotificationRead;
