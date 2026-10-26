/**
 * CaseConnect Frontend Configuration & Invariants
 */

function getApiBaseUrl() {
  if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:5000/api';
    }
    const port = window.location.port;
    const hostname = window.location.hostname;
    // If running under VS Code Live Server (port 5500), Vite (5173), or any dev server not port 5000,
    // point directly to the Express backend at port 5000 to avoid HTTP 405 Method Not Allowed errors
    if (port && port !== '5000' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return `http://${hostname}:5000/api`;
    }
  }
  return '/api';
}

const CONFIG = {
  API_BASE_URL: getApiBaseUrl(),
  DEFAULT_PAGE_SIZE: 15,
  ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    SENIOR_MONITORING_OFFICER: 'SENIOR_MONITORING_OFFICER',
    BUREAU_OFFICER: 'BUREAU_OFFICER',
    REGIONAL_REVIEWER: 'REGIONAL_REVIEWER',
    AUDITOR: 'AUDITOR',
    INSTITUTION_USER: 'INSTITUTION_USER'
  },
  STATUS_BADGES: {
    RECEIVED: { label: 'Received', class: 'badge-gray' },
    ASSIGNED: { label: 'Assigned', class: 'badge-blue' },
    UNDER_PROCESS: { label: 'Under Process', class: 'badge-amber' },
    PENDING_RESPONSE: { label: 'Pending Response', class: 'badge-amber' },
    COORDINATION_REQUESTED: { label: 'Coordination Req.', class: 'badge-purple' },
    TRANSFERRED: { label: 'Transferred', class: 'badge-blue' },
    ESCALATED: { label: 'Escalated', class: 'badge-red' },
    DISPOSED: { label: 'Disposed', class: 'badge-green' },
    CLOSED: { label: 'Closed', class: 'badge-gray' }
  },
  SEVERITY_BADGES: {
    LOW: { label: 'Low', class: 'badge-gray' },
    MEDIUM: { label: 'Medium', class: 'badge-blue' },
    HIGH: { label: 'High', class: 'badge-amber' },
    CRITICAL: { label: 'Critical', class: 'badge-red' }
  },
  PRIORITY_BADGES: {
    NORMAL: { label: 'Normal', class: 'badge-gray' },
    URGENT: { label: 'Urgent', class: 'badge-amber' },
    IMMEDIATE: { label: 'Immediate', class: 'badge-red' }
  }
};

window.CONFIG = CONFIG;
