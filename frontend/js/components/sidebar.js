/**
 * Navigation Sidebar Component
 */

function renderSidebar() {
  const sidebarEl = document.getElementById('appSidebar');
  if (!sidebarEl) return;

  if (!window.Auth?.isAuthenticated()) {
    sidebarEl.style.display = 'none';
    return;
  }
  sidebarEl.style.display = 'flex';

  const user = window.Auth?.getUser();
  const currentHash = window.location.hash || '#/dashboard';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SENIOR_MONITORING_OFFICER';

  sidebarEl.innerHTML = `
    <div style="margin-bottom: 0.75rem;">
      <button class="btn btn-primary btn-full btn-sm" id="btnRegisterCaseSidebar">
        ${window.Icons?.plus('w-3.5 h-3.5') || ''}
        <span>Register New Case</span>
      </button>
    </div>

    <div class="sidebar-heading">Case Operations</div>
    <a href="#/dashboard" class="sidebar-nav-item ${currentHash === '#/dashboard' ? 'active' : ''}">
      ${window.Icons?.dashboard('w-4 h-4') || ''}
      <span>Dashboard Overview</span>
    </a>
    <a href="#/cases" class="sidebar-nav-item ${currentHash.startsWith('#/cases') && currentHash !== '#/cases/new' ? 'active' : ''}">
      ${window.Icons?.cases('w-4 h-4') || ''}
      <span>All Cases</span>
    </a>
    <a href="#/pending-overdue" class="sidebar-nav-item ${currentHash === '#/pending-overdue' ? 'active' : ''}">
      ${window.Icons?.clock('w-4 h-4') || ''}
      <span>Pending & Overdue</span>
      <span class="nav-counter badge-red" id="sidebarOverdueCount" style="display: none;">0</span>
    </a>
    <a href="#/overlaps" class="sidebar-nav-item ${currentHash === '#/overlaps' ? 'active' : ''}">
      ${window.Icons?.gitMerge('w-4 h-4') || ''}
      <span>Cross-Bureau Overlaps</span>
      <span class="nav-counter badge-amber" id="sidebarOverlapCount" style="display: none;">0</span>
    </a>

    <div class="sidebar-heading">Institutions & Bureaus</div>
    <a href="#/institutions" class="sidebar-nav-item ${currentHash.startsWith('#/institutions') ? 'active' : ''}">
      ${window.Icons?.building('w-4 h-4') || ''}
      <span>Institutions Directory</span>
    </a>
    <a href="#/bureaus" class="sidebar-nav-item ${currentHash === '#/bureaus' ? 'active' : ''}">
      ${window.Icons?.building2('w-4 h-4') || ''}
      <span>Bureaus & Cells</span>
    </a>
    <a href="#/workload" class="sidebar-nav-item ${currentHash === '#/workload' ? 'active' : ''}">
      ${window.Icons?.workload('w-4 h-4') || ''}
      <span>Workload & Capacity</span>
    </a>

    <div class="sidebar-heading">Regulatory Intelligence</div>
    <a href="#/reports" class="sidebar-nav-item ${currentHash === '#/reports' ? 'active' : ''}">
      ${window.Icons?.fileText('w-4 h-4') || ''}
      <span>Reports & Analytics</span>
    </a>
    <a href="#/notifications" class="sidebar-nav-item ${currentHash === '#/notifications' ? 'active' : ''}">
      ${window.Icons?.bell('w-4 h-4') || ''}
      <span>Notifications & Alerts</span>
    </a>

    ${isAdmin ? `
      <div class="sidebar-heading">Governance & Administration</div>
      <a href="#/users" class="sidebar-nav-item ${currentHash === '#/users' ? 'active' : ''}">
        ${window.Icons?.users('w-4 h-4') || ''}
        <span>Officials & Users</span>
      </a>
      <a href="#/roles" class="sidebar-nav-item ${currentHash === '#/roles' ? 'active' : ''}">
        ${window.Icons?.shield('w-4 h-4') || ''}
        <span>Roles & Permissions</span>
      </a>
      <a href="#/workflow-config" class="sidebar-nav-item ${currentHash === '#/workflow-config' ? 'active' : ''}">
        ${window.Icons?.sliders('w-4 h-4') || ''}
        <span>Workflow & SLA Settings</span>
      </a>
      <a href="#/audit-logs" class="sidebar-nav-item ${currentHash === '#/audit-logs' ? 'active' : ''}">
        ${window.Icons?.scroll('w-4 h-4') || ''}
        <span>Immutable Audit Logs</span>
      </a>
    ` : ''}

    <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--color-border);">
      <a href="#/settings" class="sidebar-nav-item ${currentHash === '#/settings' ? 'active' : ''}">
        ${window.Icons?.lock('w-4 h-4') || ''}
        <span>Security & Profile</span>
      </a>
    </div>
  `;

  document.getElementById('btnRegisterCaseSidebar')?.addEventListener('click', () => {
    window.Modals?.openRegisterCaseModal();
  });

  updateSidebarCounters();
}

async function updateSidebarCounters() {
  if (!window.Auth?.isAuthenticated()) return;
  try {
    const res = await window.API.get('/reports/dashboard-stats');
    if (res.success && res.stats) {
      const overdueEl = document.getElementById('sidebarOverdueCount');
      if (overdueEl && res.stats.overdue > 0) {
        overdueEl.textContent = res.stats.overdue;
        overdueEl.style.display = 'inline-block';
      }
      const overlapEl = document.getElementById('sidebarOverlapCount');
      if (overlapEl && res.stats.pendingOverlaps > 0) {
        overlapEl.textContent = res.stats.pendingOverlaps;
        overlapEl.style.display = 'inline-block';
      }
    }
  } catch (e) {
    // Ignore silent count fail
  }
}

window.renderSidebar = renderSidebar;
