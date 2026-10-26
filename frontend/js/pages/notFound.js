/**
 * Not Found / Error Page Component
 */

function renderNotFoundPage(container) {
  const iconSearch = window.Icons?.search || '';

  container.innerHTML = `
    <div style="min-height: calc(100vh - 200px); display: flex; align-items: center; justify-content: center; padding: 2rem;">
      <div class="empty-state" style="max-width: 480px; width: 100%; padding: 3rem 2rem;">
        <div class="empty-state-icon" style="color: var(--color-primary); width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center;">
          ${iconSearch}
        </div>
        <h2 class="empty-state-title" style="font-size: 1.35rem; margin-top: 1rem;">Regulatory Record Not Found (404)</h2>
        <p class="empty-state-desc">
          The requested statutory route, case docket, or institutional profile does not exist or may have been restricted.
        </p>
        <div style="display: flex; justify-content: center; gap: 0.75rem; margin-top: 1rem;">
          <a href="#/dashboard" class="btn btn-primary btn-sm">Return to Dashboard</a>
          <a href="#/cases" class="btn btn-secondary btn-sm">All Cases</a>
        </div>
      </div>
    </div>
  `;
}

window.renderNotFoundPage = renderNotFoundPage;
