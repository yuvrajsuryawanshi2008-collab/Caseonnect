/**
 * CaseConnect Front-End Application Bootstrapper
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register all routes
  window.Router.register('/login', window.renderLoginPage, false);
  window.Router.register('/student-login', window.renderStudentLoginPage, false);
  window.Router.register('/student-register', window.renderStudentRegisterPage, false);
  window.Router.register('/student-dashboard', window.renderStudentDashboardPage, true);
  window.Router.register('/dashboard', window.renderDashboardPage, true);
  window.Router.register('/cases', window.renderCasesPage, true);
  window.Router.register('/institutions', window.renderInstitutionsPage, true);
  window.Router.register('/bureaus', window.renderBureausPage, true);
  window.Router.register('/workload', window.renderWorkloadPage, true);
  window.Router.register('/overlaps', window.renderOverlapsPage, true);
  window.Router.register('/pending-overdue', window.renderPendingOverduePage, true);
  window.Router.register('/notifications', window.renderNotificationsPage, true);
  window.Router.register('/reports', window.renderReportsPage, true);
  window.Router.register('/users', window.renderUsersPage, true, 'SUPER_ADMIN');
  window.Router.register('/roles', window.renderRolesPage, true, 'SUPER_ADMIN');
  window.Router.register('/workflow-config', window.renderWorkflowConfigPage, true, 'SUPER_ADMIN');
  window.Router.register('/audit-logs', window.renderAuditLogsPage, true);
  window.Router.register('/settings', window.renderSettingsPage, true);

  // Initialize router on the main content container
  window.Router.init('mainContentArea');

  // Periodic notification badge update every 60s
  setInterval(() => {
    window.updateNotificationBadge?.();
  }, 60000);
});
