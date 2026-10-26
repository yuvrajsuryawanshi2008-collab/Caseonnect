/**
 * Top Application Header Component with Dark Mode Toggle
 */

async function renderHeader() {
  const headerEl = document.getElementById('appHeader');
  if (!headerEl) return;

  const user = window.Auth?.getUser();
  const isAuth = window.Auth?.isAuthenticated();
  const isDark = window.Theme?.isDark();

  const themeToggleBtn = `
    <button class="btn btn-secondary btn-sm" id="themeToggleBtn" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}" style="padding: 0.35rem 0.55rem; border-radius: var(--radius-md);">
      ${isDark ? (window.Icons?.sun('w-4 h-4 text-amber-400') || '☀️') : (window.Icons?.moon('w-4 h-4 text-slate-600') || '🌙')}
    </button>
  `;

  if (!isAuth) {
    headerEl.innerHTML = `
      <div class="header-container">
        <a href="#/login" class="brand-wrapper">
          <div class="brand-icon-box">
            ${window.Icons?.logoEmblem('w-5 h-5 text-indigo-600') || ''}
          </div>
          <div class="brand-title">Case<span>Connect</span></div>
          <span class="brand-tag">AICTE Monitoring</span>
        </a>

        <div style="display: flex; align-items: center; gap: 0.65rem;">
          ${themeToggleBtn}
          <a href="#/student-login" class="btn btn-secondary btn-sm" id="headerStudentPortalBtn">
            ${window.Icons?.users('w-3.5 h-3.5 text-indigo-600') || '🎓'}
            <span>Student Portal</span>
          </a>
          <a href="#/login" class="btn btn-primary btn-sm">
            ${window.Icons?.lock('w-3.5 h-3.5') || ''}
            <span>Official Sign-In</span>
          </a>
        </div>
      </div>
    `;

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
      window.Theme?.toggleTheme();
    });
    return;
  }

  const isStudent = user?.role === 'STUDENT';
  const brandTarget = isStudent ? '#/student-dashboard' : '#/dashboard';
  const brandTag = isStudent ? 'Student Portal' : 'AICTE Regulatory Console';

  headerEl.innerHTML = `
    <div class="header-container">
      <a href="${brandTarget}" class="brand-wrapper">
        <div class="brand-icon-box">
          ${window.Icons?.logoEmblem('w-5 h-5 text-indigo-600') || ''}
        </div>
        <div class="brand-title">Case<span>Connect</span></div>
        <span class="brand-tag">${brandTag}</span>
      </a>

      ${!isStudent ? `
        <!-- Quick Search Trigger -->
        <button class="search-trigger-btn" id="openSearchBtn" title="Global Quick Search (Ctrl+K)">
          ${window.Icons?.search('w-3.5 h-3.5 text-slate-400') || ''}
          <span>Search cases or institutions...</span>
          <span class="search-shortcut">Ctrl K</span>
        </button>
      ` : `
        <div style="font-size: 0.82rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.45rem;">
          ${window.Icons?.shield('w-4 h-4 text-emerald-600') || '🛡️'}
          <span style="font-weight: 600;">AICTE Student Grievance &amp; Redressal Desk</span>
        </div>
      `}

      <!-- Right Header Actions -->
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <!-- Live Database Status Indicator -->
        <div id="headerDbStatusIndicator" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: var(--radius-full); background: var(--color-surface-subtle); color: var(--color-text-muted); border: 1px solid var(--color-border);">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background: #94a3b8;"></span>
          <span>Checking DB...</span>
        </div>

        <!-- Theme Toggle -->
        ${themeToggleBtn}

        ${!isStudent ? `
          <!-- Notification Bell -->
          <a href="#/notifications" class="btn btn-secondary btn-sm" style="position: relative; padding: 0.35rem 0.55rem;" title="Notifications">
            ${window.Icons?.bell('w-4 h-4 text-slate-600') || ''}
            <span id="headerUnreadBadge" style="display: none; position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 0.6rem; padding: 0.05rem 0.3rem; border-radius: 9999px; font-weight: 700;"></span>
          </a>

          <!-- Bureau Indicator Pill -->
          <span class="badge badge-indigo" style="font-weight: 700; font-size: 0.72rem;">
            ${user?.bureauId ? `Bureau: ${user.bureauId}` : 'AICTE Cell'}
          </span>
        ` : `
          <!-- Verified Student Pill -->
          <span class="badge badge-green" style="font-weight: 700; font-size: 0.72rem;">
            ✓ Active Student
          </span>
        `}

        <!-- User / Student Profile Menu -->
        <div style="display: flex; align-items: center; gap: 0.5rem; border-left: 1px solid var(--color-border); padding-left: 0.75rem;">
          <div style="width: 30px; height: 30px; border-radius: 9999px; background: var(--color-primary-light); color: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.78rem;">
            ${(user?.fullName || (isStudent ? 'S' : 'O')).charAt(0).toUpperCase()}
          </div>
          <div style="display: flex; flex-direction: column; line-height: 1.15; max-width: 140px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${user?.fullName || (isStudent ? 'Student' : 'Official')}
            </span>
            <span style="font-size: 0.68rem; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${isStudent ? (user?.college || 'Student') : (user?.role?.replace(/_/g, ' ') || 'Officer')}
            </span>
          </div>
          <button class="btn btn-secondary btn-sm" id="logoutBtn" style="padding: 0.3rem 0.45rem; margin-left: 0.2rem;" title="Sign Out">
            ${window.Icons?.logOut('w-3.5 h-3.5 text-slate-600') || ''}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    window.Theme?.toggleTheme();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    window.Auth?.logout();
  });

  document.getElementById('openSearchBtn')?.addEventListener('click', () => {
    window.Modals?.openSearchModal();
  });

  checkDatabaseStatus();
  updateNotificationBadge();
}

async function checkDatabaseStatus() {
  const el = document.getElementById('headerDbStatusIndicator');
  if (!el) return;

  try {
    const res = await window.API.get('/health');
    if (res.status === 'ONLINE' && res.database?.connected) {
      el.innerHTML = `
        <span style="width: 7px; height: 7px; border-radius: 9999px; background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.6);"></span>
        <span style="color: #10b981;">DB Online</span>
      `;
      el.title = `Database Status: Online (${res.database?.provider || 'MongoDB Cluster'})`;
    } else {
      el.innerHTML = `
        <span style="width: 7px; height: 7px; border-radius: 9999px; background: #ef4444;"></span>
        <span style="color: #ef4444;">DB Offline</span>
      `;
      el.title = `Database Offline: ${res.database?.error || 'Service unreachable'}`;
    }
  } catch (e) {
    el.innerHTML = `
      <span style="width: 7px; height: 7px; border-radius: 9999px; background: #ef4444;"></span>
      <span style="color: #ef4444;">API Offline</span>
    `;
    el.title = 'Cannot connect to CaseConnect API backend';
  }
}

async function updateNotificationBadge() {
  const badgeEl = document.getElementById('headerUnreadBadge');
  const sidebarCountEl = document.getElementById('sidebarOverdueCount');
  if (!window.Auth?.isAuthenticated()) return;

  try {
    const res = await window.API.get('/notifications');
    if (res.success && res.unreadCount > 0) {
      if (badgeEl) {
        badgeEl.textContent = res.unreadCount > 9 ? '9+' : res.unreadCount;
        badgeEl.style.display = 'inline-block';
      }
      if (sidebarCountEl) {
        sidebarCountEl.textContent = res.unreadCount;
        sidebarCountEl.style.display = 'inline-block';
      }
    } else {
      if (badgeEl) badgeEl.style.display = 'none';
      if (sidebarCountEl) sidebarCountEl.style.display = 'none';
    }
  } catch (e) {
    // Non-blocking
  }
}

window.renderHeader = renderHeader;
window.updateNotificationBadge = updateNotificationBadge;
