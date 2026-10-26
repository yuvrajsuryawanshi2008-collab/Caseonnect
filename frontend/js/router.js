/**
 * Client-Side SPA Hash Router & Route Guard Engine
 */

class AppRouter {
  constructor() {
    this.mainContainer = null;
    this.routes = {};
  }

  init(containerId) {
    this.mainContainer = document.getElementById(containerId);
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  register(path, handler, isProtected = true, requiredRole = null) {
    this.routes[path] = { handler, isProtected, requiredRole };
  }

  handleRoute() {
    const rawHash = window.location.hash || '#/dashboard';
    const [pathPart, queryPart] = rawHash.split('?');
    const path = pathPart.replace(/^#/, '') || '/dashboard';

    // Update Header & Sidebar
    window.renderHeader?.();
    window.renderSidebar?.();

    const isAuthenticated = window.Auth.isAuthenticated();

    // Route guard 1: Non-authenticated trying to access protected routes
    if (!isAuthenticated && path !== '/login') {
      window.location.hash = '#/login';
      return;
    }

    // Route guard 2: Authenticated user visiting /login
    if (isAuthenticated && path === '/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    if (!this.mainContainer) return;

    // Match dynamic routes like /cases/:id or /institutions/:id
    const caseMatch = path.match(/^\/cases\/([a-zA-Z0-9_-]+)$/);
    if (caseMatch) {
      window.renderCaseDetailsPage(this.mainContainer, caseMatch[1]);
      window.scrollTo(0, 0);
      return;
    }

    const instMatch = path.match(/^\/institutions\/([a-zA-Z0-9_-]+)$/);
    if (instMatch) {
      window.renderInstitutionProfilePage(this.mainContainer, instMatch[1]);
      window.scrollTo(0, 0);
      return;
    }

    // Exact route match
    const route = this.routes[path];
    if (route) {
      if (route.requiredRole && !window.Auth.hasRole(route.requiredRole)) {
        this.mainContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon" style="color: var(--color-primary); width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center;">
              ${window.Icons?.shield || ''}
            </div>
            <div class="empty-state-title" style="margin-top: 1rem;">Access Restricted (403)</div>
            <div class="empty-state-desc">Your official role does not possess authorization to access this administrative module.</div>
            <a href="#/dashboard" class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">Return to Dashboard</a>
          </div>
        `;
        return;
      }
      route.handler(this.mainContainer);
    } else {
      window.renderNotFoundPage(this.mainContainer);
    }

    window.scrollTo(0, 0);
  }
}

window.Router = new AppRouter();
