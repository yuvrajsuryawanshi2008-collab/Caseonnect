/**
 * Roles & Permissions Matrix Page Component
 */

function renderRolesPage(container) {
  container.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--color-text); letter-spacing: -0.02em;">
        Roles & Authorization Matrix
      </h1>
      <p style="font-size: 0.8rem; color: var(--color-text-muted);">
        Fine-grained permission controls enforced on every backend API endpoint and database transaction.
      </p>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="data-table-wrapper" style="border: none; border-radius: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Functional Scope / Capability</th>
              <th style="text-align: center;">Super Admin</th>
              <th style="text-align: center;">Senior Monitoring</th>
              <th style="text-align: center;">Bureau Officer</th>
              <th style="text-align: center;">Regional Reviewer</th>
              <th style="text-align: center;">Auditor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Register New Case / Complaint</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
            <tr>
              <td><strong>Update Case Workflow Status</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
            <tr>
              <td><strong>Cross-Bureau Overlap Adjudication</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
            <tr>
              <td><strong>Assign / Reassign Case Officers</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
            <tr>
              <td><strong>Formal Case Disposal Order</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
            <tr>
              <td><strong>Register / Edit Institution Records</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
            <tr>
              <td><strong>Access Immutable Security Audit Trail</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
            </tr>
            <tr>
              <td><strong>Configure System SLA & Workflow Rules</strong></td>
              <td style="text-align: center; color: var(--color-success); font-weight: 800;">${window.Icons?.check('w-4 h-4 mx-auto text-emerald-600') || '✓'}</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
              <td style="text-align: center; color: var(--color-text-muted);">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.renderRolesPage = renderRolesPage;
