/**
 * Global Modals Engine
 */

class ModalEngine {
  constructor() {
    this.container = null;
    this.ensureContainer();
    this.setupShortcuts();
  }

  ensureContainer() {
    this.container = document.getElementById('globalModalWrapper');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'globalModalWrapper';
      document.body.appendChild(this.container);
    }
  }

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearchModal();
      }
      // Escape to close
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });
  }

  closeAll() {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(m => m.classList.remove('active'));
    setTimeout(() => {
      if (this.container) this.container.innerHTML = '';
    }, 200);
  }

  // 1. Global Quick Search Modal (Ctrl+K)
  async openSearchModal() {
    this.ensureContainer();
    this.container.innerHTML = `
      <div class="modal-overlay active" id="searchModalOverlay">
        <div class="modal-container search-modal-container">
          <div class="search-input-wrapper">
            ${window.Icons?.search('w-4 h-4 text-slate-400') || ''}
            <input 
              type="text" 
              class="search-input-field" 
              id="globalSearchInput" 
              placeholder="Search case number, title, permanent ID, or institution..." 
              autocomplete="off" 
            />
            <button class="modal-close-btn" id="closeSearchModalBtn">
              ${window.Icons?.x('w-4 h-4') || '✕'}
            </button>
          </div>
          <div style="padding: 0.85rem 1rem; max-height: 380px; overflow-y: auto;" id="searchResultsList">
            <div style="font-size: 0.78rem; color: var(--color-text-muted); text-align: center; padding: 1.5rem 0;">
              Type keywords, Case Number (e.g. CASE-2026), or Permanent ID (e.g. 1-10928371)...
            </div>
          </div>
        </div>
      </div>
    `;

    const input = document.getElementById('globalSearchInput');
    const resultsContainer = document.getElementById('searchResultsList');
    input?.focus();

    document.getElementById('closeSearchModalBtn')?.addEventListener('click', () => this.closeAll());
    document.getElementById('searchModalOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'searchModalOverlay') this.closeAll();
    });

    let debounceTimer;
    input?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (!query) {
        resultsContainer.innerHTML = `
          <div style="font-size: 0.78rem; color: var(--color-text-muted); text-align: center; padding: 1.5rem 0;">
            Type keywords, Case Number (e.g. CASE-2026), or Permanent ID...
          </div>
        `;
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const [caseRes, instRes] = await Promise.all([
            window.API.get('/cases', { query, limit: 5 }),
            window.API.get('/institutions', { query })
          ]);

          let html = '';

          // Render matching cases
          if (caseRes.cases && caseRes.cases.length) {
            html += `<div style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.35rem; letter-spacing: 0.05em;">Cases (${caseRes.cases.length})</div>`;
            caseRes.cases.forEach(c => {
              html += `
                <a href="#/cases/${c._id}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.65rem; border-radius: var(--radius-md); text-decoration: none; color: var(--color-text); margin-bottom: 0.3rem; background: #f8fafc; border: 1px solid var(--color-border);" onclick="window.Modals.closeAll()">
                  <div>
                    <div style="font-weight: 700; font-size: 0.82rem;">${c.caseNumber} • <span style="font-weight: 500;">${c.title}</span></div>
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">${c.institutionName} • Bureau: ${c.bureauCode}</div>
                  </div>
                  <span class="badge ${window.CONFIG.STATUS_BADGES[c.status]?.class || 'badge-gray'}">${c.status}</span>
                </a>
              `;
            });
          }

          // Render matching institutions
          if (instRes.institutions && instRes.institutions.length) {
            html += `<div style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin: 0.75rem 0 0.35rem; letter-spacing: 0.05em;">Institutions (${instRes.institutions.length})</div>`;
            instRes.institutions.slice(0, 5).forEach(i => {
              html += `
                <a href="#/institutions/${i._id}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.65rem; border-radius: var(--radius-md); text-decoration: none; color: var(--color-text); margin-bottom: 0.3rem; background: #f8fafc; border: 1px solid var(--color-border);" onclick="window.Modals.closeAll()">
                  <div>
                    <div style="font-weight: 700; font-size: 0.82rem;">${i.name}</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-muted);">Permanent ID: ${i.permanentId} • ${i.city}, ${i.state}</div>
                  </div>
                  <span class="badge badge-indigo">360° Profile</span>
                </a>
              `;
            });
          }

          if (!html) {
            html = `<div style="text-align: center; color: var(--color-text-muted); padding: 1.5rem 0; font-size: 0.8rem;">No matching regulatory records found for "${query}".</div>`;
          }

          resultsContainer.innerHTML = html;
        } catch (err) {
          resultsContainer.innerHTML = `<div style="color: var(--color-danger); text-align: center; padding: 1rem; font-size: 0.8rem;">Search error: ${err.message}</div>`;
        }
      }, 250);
    });
  }

  // 2. Register New Case Modal
  async openRegisterCaseModal(preselectedInstitutionId = null) {
    this.ensureContainer();

    let institutions = [];
    let bureaus = [];
    try {
      const [instRes, burRes] = await Promise.all([
        window.API.get('/institutions'),
        window.API.get('/bureaus')
      ]);
      institutions = instRes.institutions || [];
      bureaus = burRes.bureaus || [];
    } catch (e) {
      window.Toast.error('Failed fetching preliminary lookup lists: ' + e.message);
      return;
    }

    if (!institutions.length) {
      window.Toast.warning('No institutions registered yet. Please add an institution first.');
      this.openAddInstitutionModal();
      return;
    }

    this.container.innerHTML = `
      <div class="modal-overlay active" id="registerCaseModalOverlay">
        <div class="modal-container" style="max-width: 680px;">
          <div class="modal-header">
            <div class="modal-title">Register Institution Complaint / Regulatory Matter</div>
            <button class="modal-close-btn" id="closeRegCaseBtn">
              ${window.Icons?.x('w-4 h-4') || '✕'}
            </button>
          </div>
          <div class="modal-body">
            <form id="registerCaseForm">
              <div class="form-group">
                <label class="form-label" for="regInstitution">Technical Institution *</label>
                <select class="form-control" id="regInstitution" required>
                  <option value="">-- Select Institution --</option>
                  ${institutions.map(i => `
                    <option value="${i._id}" ${preselectedInstitutionId === i._id ? 'selected' : ''}>
                      [${i.permanentId}] ${i.name} (${i.city}, ${i.state})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" for="regBureau">Assigned Intake Bureau / Cell *</label>
                  <select class="form-control" id="regBureau" required>
                    ${bureaus.map(b => `
                      <option value="${b.code}" ${b.code === 'PGRC' ? 'selected' : ''}>${b.code} - ${b.name}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="regCategory">Grievance Category *</label>
                  <select class="form-control" id="regCategory" required>
                    <option>Faculty & Salary Disputes</option>
                    <option>Fee Overcharging / Capitation</option>
                    <option>Withholding Academic Certificates</option>
                    <option>Infrastructure Deficiencies</option>
                    <option>Admission & Quota Irregularities</option>
                    <option>Harassment & Discrimination</option>
                    <option>Unauthorized / Unapproved Programs</option>
                    <option>Examination & Evaluation Malpractice</option>
                    <option>General Administrative Grievance</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="regTitle">Complaint Title / Subject *</label>
                <input type="text" class="form-control" id="regTitle" placeholder="Concise statement of allegation or inquiry" required maxlength="250" />
              </div>

              <div class="form-group">
                <label class="form-label" for="regDescription">Detailed Complaint Description *</label>
                <textarea class="form-control" id="regDescription" rows="3" placeholder="Provide factual details, specific departments involved, and relevant dates..." required maxlength="3000"></textarea>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" for="regSeverity">Severity Assessment</label>
                  <select class="form-control" id="regSeverity">
                    <option value="LOW">Low (Informational)</option>
                    <option value="MEDIUM" selected>Medium (Standard)</option>
                    <option value="HIGH">High (Urgent Impact)</option>
                    <option value="CRITICAL">Critical (Severe)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="regPriority">Processing Priority</label>
                  <select class="form-control" id="regPriority">
                    <option value="NORMAL" selected>Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="IMMEDIATE">Immediate</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="regPetitionerType">Petitioner Classification</label>
                  <select class="form-control" id="regPetitionerType">
                    <option selected>Student</option>
                    <option>Faculty</option>
                    <option>Parent</option>
                    <option>Public / Whistleblower</option>
                    <option>Institution Staff</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" for="regPetitionerName">Petitioner / Complainant Name</label>
                  <input type="text" class="form-control" id="regPetitionerName" placeholder="Full name or 'Confidential'" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="regNextAction">Next Required Regulatory Action</label>
                  <input type="text" class="form-control" id="regNextAction" value="Initial Scrutiny & Bureau Review" />
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
                <button type="button" class="btn btn-secondary" id="cancelRegCaseBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="submitRegCaseBtn">
                  <span>Register & Run Overlap Check</span>
                  ${window.Icons?.arrowRight('w-3.5 h-3.5') || '→'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeRegCaseBtn')?.addEventListener('click', () => this.closeAll());
    document.getElementById('cancelRegCaseBtn')?.addEventListener('click', () => this.closeAll());

    const form = document.getElementById('registerCaseForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitRegCaseBtn');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Registering & Scanning...';

      try {
        const body = {
          institutionId: document.getElementById('regInstitution').value,
          bureauCode: document.getElementById('regBureau').value,
          category: document.getElementById('regCategory').value,
          title: document.getElementById('regTitle').value.trim(),
          description: document.getElementById('regDescription').value.trim(),
          severity: document.getElementById('regSeverity').value,
          priority: document.getElementById('regPriority').value,
          petitionerType: document.getElementById('regPetitionerType').value,
          petitionerName: document.getElementById('regPetitionerName').value.trim() || 'Undisclosed',
          nextRequiredAction: document.getElementById('regNextAction').value.trim()
        };

        const res = await window.API.post('/cases', body);
        window.Toast.success(`Case ${res.case.caseNumber} registered.`);

        if (res.detectedOverlapsCount > 0) {
          window.Toast.warning(`Cross-Bureau Overlap Engine detected ${res.detectedOverlapsCount} potential overlaps. Coordination review required.`);
        }

        this.closeAll();
        if (window.location.hash.startsWith('#/cases')) {
          window.dispatchEvent(new Event('hashchange'));
        } else {
          window.location.hash = `#/cases/${res.case._id}`;
        }
      } catch (err) {
        window.Toast.error(err.message || 'Registration failed.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Register & Run Overlap Check</span> ${window.Icons?.arrowRight('w-3.5 h-3.5') || '→'}`;
      }
    });
  }

  // 3. Add Institution Modal
  openAddInstitutionModal() {
    this.ensureContainer();
    this.container.innerHTML = `
      <div class="modal-overlay active" id="addInstitutionModalOverlay">
        <div class="modal-container" style="max-width: 600px;">
          <div class="modal-header">
            <div class="modal-title">Register Statutory Technical Institution</div>
            <button class="modal-close-btn" id="closeAddInstBtn">
              ${window.Icons?.x('w-4 h-4') || '✕'}
            </button>
          </div>
          <div class="modal-body">
            <form id="addInstitutionForm">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" for="instPermId">Permanent Statutory ID *</label>
                  <input type="text" class="form-control" id="instPermId" placeholder="e.g. 1-10928371" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="instType">Classification *</label>
                  <select class="form-control" id="instType" required>
                    <option>Unaided-Private</option>
                    <option>Government</option>
                    <option>Govt-Aided</option>
                    <option>University-Dept</option>
                    <option>Deemed-University</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="instName">Legal Institution Name *</label>
                <input type="text" class="form-control" id="instName" placeholder="Full statutory name" required />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" for="instRegion">Region *</label>
                  <select class="form-control" id="instRegion" required>
                    <option>Western</option>
                    <option>Northern</option>
                    <option>North-Western</option>
                    <option>Central</option>
                    <option>South-Western</option>
                    <option>Southern</option>
                    <option>Eastern</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="instState">State *</label>
                  <input type="text" class="form-control" id="instState" placeholder="e.g. Maharashtra" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="instCity">City *</label>
                  <input type="text" class="form-control" id="instCity" placeholder="e.g. Pune" required />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                  <label class="form-label" for="instIntake">Approved Intake</label>
                  <input type="number" class="form-control" id="instIntake" value="480" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="instAffiliation">Affiliated University</label>
                  <input type="text" class="form-control" id="instAffiliation" placeholder="State/Central Board" />
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
                <button type="button" class="btn btn-secondary" id="cancelAddInstBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="submitAddInstBtn">Register Institution</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeAddInstBtn')?.addEventListener('click', () => this.closeAll());
    document.getElementById('cancelAddInstBtn')?.addEventListener('click', () => this.closeAll());

    const form = document.getElementById('addInstitutionForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const body = {
          permanentId: document.getElementById('instPermId').value.trim(),
          name: document.getElementById('instName').value.trim(),
          institutionType: document.getElementById('instType').value,
          region: document.getElementById('instRegion').value,
          state: document.getElementById('instState').value.trim(),
          city: document.getElementById('instCity').value.trim(),
          approvedIntake: document.getElementById('instIntake').value,
          affiliatedUniversity: document.getElementById('instAffiliation').value.trim()
        };

        const res = await window.API.post('/institutions', body);
        window.Toast.success(`Institution ${res.institution.name} registered.`);
        this.closeAll();
        window.dispatchEvent(new Event('hashchange'));
      } catch (err) {
        window.Toast.error(err.message || 'Institution registration failed.');
      }
    });
  }

  // 4. Status Transition Modal
  openStatusModal(caseId, currentStatus, onComplete) {
    const allowed = window.CONFIG?.ALLOWED_TRANSITIONS?.[currentStatus] || [
      'ASSIGNED', 'UNDER_PROCESS', 'PENDING_RESPONSE', 'COORDINATION_REQUESTED', 'TRANSFERRED', 'ESCALATED', 'DISPOSED', 'CLOSED'
    ];

    this.ensureContainer();
    this.container.innerHTML = `
      <div class="modal-overlay active" id="statusModalOverlay">
        <div class="modal-container" style="max-width: 480px;">
          <div class="modal-header">
            <div class="modal-title">Update Workflow Status</div>
            <button class="modal-close-btn" id="closeStatusModalBtn">
              ${window.Icons?.x('w-4 h-4') || '✕'}
            </button>
          </div>
          <div class="modal-body">
            <form id="statusUpdateForm">
              <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.85rem;">
                Current Status: <span class="badge ${window.CONFIG.STATUS_BADGES[currentStatus]?.class || 'badge-gray'}">${currentStatus}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="targetStatusSelect">Next Permitted Status *</label>
                <select class="form-control" id="targetStatusSelect" required>
                  <option value="">-- Select Status --</option>
                  ${allowed.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="statusRemarks">Official Transition Remarks *</label>
                <textarea class="form-control" id="statusRemarks" rows="3" placeholder="Provide factual context for this transition..." required></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
                <button type="button" class="btn btn-secondary" id="cancelStatusBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="confirmStatusBtn">Execute Transition</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeStatusModalBtn')?.addEventListener('click', () => this.closeAll());
    document.getElementById('cancelStatusBtn')?.addEventListener('click', () => this.closeAll());

    document.getElementById('statusUpdateForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetStatus = document.getElementById('targetStatusSelect').value;
      const remarks = document.getElementById('statusRemarks').value.trim();

      try {
        await window.API.post(`/cases/${caseId}/status`, { targetStatus, remarks });
        window.Toast.success(`Case status transitioned to ${targetStatus}`);
        this.closeAll();
        if (onComplete) onComplete();
      } catch (err) {
        window.Toast.error(err.message || 'Status transition rejected by server.');
      }
    });
  }

  // 5. Assign Officer Modal
  async openAssignOfficerModal(caseId, onComplete) {
    this.ensureContainer();
    let users = [];
    try {
      const res = await window.API.get('/users');
      users = res.users || [];
    } catch (e) {
      users = [];
    }

    this.container.innerHTML = `
      <div class="modal-overlay active" id="assignOfficerModalOverlay">
        <div class="modal-container" style="max-width: 480px;">
          <div class="modal-header">
            <div class="modal-title">Assign / Reassign Case Officer</div>
            <button class="modal-close-btn" id="closeAssignModalBtn">
              ${window.Icons?.x('w-4 h-4') || '✕'}
            </button>
          </div>
          <div class="modal-body">
            <form id="assignOfficerForm">
              <div class="form-group">
                <label class="form-label" for="officerSelect">Authorized Scrutiny Officer *</label>
                <select class="form-control" id="officerSelect" required>
                  <option value="">-- Select Officer --</option>
                  ${users.map(u => `
                    <option value="${u._id}">${u.fullName} (${u.bureauId} • ${u.designation})</option>
                  `).join('')}
                </select>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
                <button type="button" class="btn btn-secondary" id="cancelAssignBtn">Cancel</button>
                <button type="submit" class="btn btn-primary" id="confirmAssignBtn">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeAssignModalBtn')?.addEventListener('click', () => this.closeAll());
    document.getElementById('cancelAssignBtn')?.addEventListener('click', () => this.closeAll());

    document.getElementById('assignOfficerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const officerId = document.getElementById('officerSelect').value;
      try {
        await window.API.post(`/cases/${caseId}/assign`, { officerId });
        window.Toast.success('Officer assignment updated.');
        this.closeAll();
        if (onComplete) onComplete();
      } catch (err) {
        window.Toast.error(err.message || 'Failed assigning officer.');
      }
    });
  }

  // 6. Formal Case Disposal Modal
  openDisposalModal(caseId, onComplete) {
    this.ensureContainer();
    this.container.innerHTML = `
      <div class="modal-overlay active" id="disposalModalOverlay">
        <div class="modal-container" style="max-width: 540px;">
          <div class="modal-header">
            <div class="modal-title">Order Formal Case Disposal</div>
            <button class="modal-close-btn" id="closeDisposalModalBtn">
              ${window.Icons?.x('w-4 h-4') || '✕'}
            </button>
          </div>
          <div class="modal-body">
            <form id="disposalForm">
              <div class="form-group">
                <label class="form-label" for="disposalResolution">Conclusive Findings & Disposal Resolution *</label>
                <textarea class="form-control" id="disposalResolution" rows="3" placeholder="State conclusive findings and justification for closure..." required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="disposalDirective">Regulatory Directive / Penalty Order</label>
                <input type="text" class="form-control" id="disposalDirective" placeholder="e.g. Rectification Notice Issued, Refund Ordered, or Unsubstantiated" />
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.85rem;">
                <button type="button" class="btn btn-secondary" id="cancelDisposalBtn">Cancel</button>
                <button type="submit" class="btn btn-danger" id="confirmDisposalBtn">Execute Disposal Order</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeDisposalModalBtn')?.addEventListener('click', () => this.closeAll());
    document.getElementById('cancelDisposalBtn')?.addEventListener('click', () => this.closeAll());

    document.getElementById('disposalForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resolution = document.getElementById('disposalResolution').value.trim();
      const penaltyOrDirective = document.getElementById('disposalDirective').value.trim();

      try {
        await window.API.post(`/cases/${caseId}/disposal`, { resolution, penaltyOrDirective });
        window.Toast.success('Case disposal order executed.');
        this.closeAll();
        if (onComplete) onComplete();
      } catch (err) {
        window.Toast.error(err.message || 'Disposal order failed.');
      }
    });
  }
}

window.Modals = new ModalEngine();
