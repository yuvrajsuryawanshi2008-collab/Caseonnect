/**
 * Security & Official Profile Settings Page Component with Theme Customization
 */

function renderSettingsPage(container) {
  const user = window.Auth.getUser() || {};
  const iconLock = window.Icons?.lock || '';
  const iconLogOut = window.Icons?.logOut || '';
  const iconUser = window.Icons?.userCheck || '';
  const iconSun = window.Icons?.sun || '';
  const iconMoon = window.Icons?.moon || '';
  const isDark = window.Theme?.isDark();

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
        <span style="color: var(--color-primary); display: inline-flex;">${iconLock}</span>
        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0;">Security & Official Profile</h1>
      </div>
      <p style="font-size: 0.88rem; color: var(--color-text-muted); margin: 0;">
        Manage your official council credentials, theme preferences, and active authentication session.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
      <!-- Profile Card -->
      <div class="card">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="color: var(--color-primary); display: inline-flex;">${iconUser}</span>
          <h3 class="card-title" style="margin: 0;">Official Dossier</h3>
        </div>
        <p class="card-desc" style="margin-bottom: 1.25rem;">Authorized institutional identity details</p>

        <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.88rem;">
          <div>
            <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; display: block;">Official Name</span>
            <strong style="font-size: 1rem; color: var(--color-text);">${user.fullName || 'Official'}</strong>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; display: block;">Council Email</span>
            <strong style="color: var(--color-text);">${user.email || '—'}</strong>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; display: block;">Designation</span>
            <strong style="color: var(--color-text);">${user.designation || 'Institutional Scrutiny Officer'}</strong>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Assigned Bureau / Cell</span>
            <span class="badge badge-indigo">${user.bureauId || 'Council Cell'}</span>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">System Role</span>
            <span class="badge badge-purple">${user.role?.replace(/_/g, ' ') || 'Official'}</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1.25rem;">
          <button class="btn btn-secondary btn-full btn-sm" onclick="window.Auth.logout()" style="justify-content: center; gap: 0.5rem;">
            ${iconLogOut}
            <span>Sign Out of Console</span>
          </button>
        </div>
      </div>

      <!-- Appearance & Theme Preferences -->
      <div class="card">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="color: var(--color-primary); display: inline-flex;">${isDark ? iconMoon : iconSun}</span>
          <h3 class="card-title" style="margin: 0;">Interface Theme & Appearance</h3>
        </div>
        <p class="card-desc" style="margin-bottom: 1.25rem;">Choose your preferred display mode for regulatory monitoring</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <!-- Light Mode Option -->
          <button type="button" id="setLightModeBtn" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border-radius: var(--radius-md); border: 2px solid ${!isDark ? 'var(--color-primary)' : 'var(--color-border)'}; background: ${!isDark ? 'var(--color-primary-light)' : 'var(--color-surface)'}; cursor: pointer; text-align: center; transition: all 0.15s ease;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: #ffffff; color: #f59e0b; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); border: 1px solid #e2e8f0;">
              ${iconSun}
            </div>
            <strong style="font-size: 0.85rem; color: var(--color-text);">Light Mode</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-muted);">Standard high-clarity daylight theme</span>
          </button>

          <!-- Dark Mode Option -->
          <button type="button" id="setDarkModeBtn" style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border-radius: var(--radius-md); border: 2px solid ${isDark ? 'var(--color-primary)' : 'var(--color-border)'}; background: ${isDark ? 'var(--color-primary-light)' : 'var(--color-surface)'}; cursor: pointer; text-align: center; transition: all 0.15s ease;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: #0f172a; color: #818cf8; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); border: 1px solid #1e293b;">
              ${iconMoon}
            </div>
            <strong style="font-size: 0.85rem; color: var(--color-text);">Dark Mode</strong>
            <span style="font-size: 0.72rem; color: var(--color-text-muted);">Low-glare contrast for long sessions</span>
          </button>
        </div>

        <div style="padding: 0.75rem 1rem; background: var(--color-surface-subtle); border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: 0.78rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--color-primary); font-weight: 700;">Tip:</span>
          <span>You can also toggle between Light and Dark mode anytime using the sun/moon icon in the top header bar.</span>
        </div>
      </div>

      <!-- Change Password Form -->
      <div class="card" style="grid-column: 1 / -1;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="color: var(--color-primary); display: inline-flex;">${iconLock}</span>
          <h3 class="card-title" style="margin: 0;">Update Security Password</h3>
        </div>
        <p class="card-desc" style="margin-bottom: 1.25rem;">Must be at least 8 characters long with uppercase and numeric characters</p>

        <form id="changePasswordForm" style="max-width: 520px;">
          <div class="form-group">
            <label class="form-label" for="currentPassword">Current Authorized Password *</label>
            <input type="password" class="form-control" id="currentPassword" required autocomplete="current-password" />
          </div>

          <div class="form-group">
            <label class="form-label" for="newPassword">New Password *</label>
            <input type="password" class="form-control" id="newPassword" required minlength="8" autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm New Password *</label>
            <input type="password" class="form-control" id="confirmPassword" required minlength="8" autocomplete="new-password" />
          </div>

          <button type="submit" class="btn btn-primary" id="btnUpdatePassword" style="margin-top: 0.75rem;">
            Update Authentication Password
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('setLightModeBtn')?.addEventListener('click', () => {
    window.Theme?.setTheme('light');
    renderSettingsPage(container);
  });

  document.getElementById('setDarkModeBtn')?.addEventListener('click', () => {
    window.Theme?.setTheme('dark');
    renderSettingsPage(container);
  });

  document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      window.Toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      await window.API.post('/auth/change-password', { currentPassword, newPassword });
      window.Toast.success('Password updated successfully.');
      document.getElementById('changePasswordForm').reset();
    } catch (err) {
      window.Toast.error(err.message || 'Failed updating password.');
    }
  });
}

window.renderSettingsPage = renderSettingsPage;
