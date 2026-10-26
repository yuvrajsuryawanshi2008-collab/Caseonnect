# Operational Domain & Problem Research Report

**System Name**: CaseConnect  
**Problem Domain**: Centralized Institutional Complaint & Regulatory Case Monitoring Across Specialized Regulatory Bureaus & Public Grievance Cells  
**Problem Reference ID**: SIH26264 (National Institutional Governance Category)  
**Target Organization Context**: All India Council for Technical Education (AICTE) & Affiliated Regulatory Bodies  
**Classification**: Enterprise Architecture & Institutional Case Management Specification  
**Document Version**: 1.0.0 (Production Architecture)  

---

## 1. Executive Summary & Problem Context

In large technical education governance frameworks such as AICTE, thousands of technical institutions (engineering colleges, management institutes, polytechnics, pharmacy colleges, and MCA institutions) operate under statutory standards. Annually, multiple bureaus, regional offices, and grievance cells receive hundreds of complaints, petitions, whistleblower claims, and statutory appeals from students, faculty, non-teaching staff, parents, and citizen advocates.

Historically, complaint intake and processing have been departmentalized into distinct functional silos:
1. **Public Grievance Redressal Cell (PGRC)**: Directly handles student and faculty grievances such as fee overcharging, withholding of original academic certificates, harassment, denial of admission quotas, and examination anomalies.
2. **Regulation Bureau (RB)**: Monitors compliance with Council norms, statutory approvals, faculty-to-student ratios, accreditation benchmarks, unauthorized courses, and infrastructure deficiencies.
3. **Approval Bureau (AB)**: Manages annual approval processes, extension of approvals (EoA), intake increases, closure of programs, and land/building compliance.
4. **Policy & Academic Planning Bureau (PAPB)**: Handles curriculum standards, academic disputes, and policy violations.
5. **Regional Offices (RO)**: Provide ground-level fact-finding, scrutiny visits, and state-level regulatory interaction.

### The Core Operational Breakdown
When these units operate on isolated ticketing queues or physical register books:
- **Duplicated Inquiries**: PGRC may launch an inquiry into faculty salaries at Institution X while the Regulation Bureau independently investigates faculty cadre deficiencies at the same institution, both issuing conflicting notices to the college administration.
- **Fragmented Visibility**: A bureau evaluating an institution's application for intake expansion is unaware that PGRC has multiple unresolved, severe sexual harassment or financial fraud complaints against the institution.
- **Coordination Vacuum**: Bureau officers lack a unified view of case ownership, who last contacted the institution, what commitments were made, and which deadlines are ticking.
- **Risk of Overlapping/Contradictory Directives**: Two bureaus may impose conflicting compliance dates on an institution, harming administrative credibility and legal defensibility.

---

## 2. Stakeholders & Organizational Responsibilities

| Role / Stakeholder | Operational Scope | System Privileges & Responsibilities |
| :--- | :--- | :--- |
| **Senior Monitoring Official / Chief Vigilance Officer** | Cross-Bureau Oversight | Global visibility across all Bureaus/Cells; monitors SLAs, bottlenecked cases, systemic compliance violations, and cross-bureau conflict resolutions. |
| **Bureau / Cell Officer (e.g., RB / PGRC)** | Operational Case Processing | Owns assigned cases within their Bureau; conducts scrutiny, logs hearing notices, updates evidence, initiates cross-bureau coordination, and recommends disposal. |
| **Reviewing / Regional Scrutiny Officer** | Institutional Scrutiny & Field Audit | Accesses consolidated Institution 360° dossiers; reviews physical audit reports, validates infrastructure/faculty records, logs field findings. |
| **System Administrator** | Governance & Access Control | Manages organizational units, user roles, security policies, audit configurations, category definitions, and system SLA parameters. |
| **Compliance Auditor** | Independent Audit & Transparency | Read-only immutable access to case timelines, transfer histories, overlap review decisions, and resolution records. |

---

## 3. Institution 360° Profile: The Single Source of Truth

A critical requirement of the system is the **Institution 360° Profile**. In technical education regulation, every institution holds a validated statutory identifier (such as the AICTE Permanent Institution ID, e.g., `1-10972341`).

The Institution Profile consolidates:
- **Statutory Meta**: Permanent ID, Legal Name, Institution Type (Autonomous, Affiliated, Deemed, University Department), Region, State, Address, Approved Intake, Affiliated University.
- **Unified Case Ledger**: Real-time cross-tabulation of all cases filed against the institution across all bureaus (e.g., 3 under PGRC, 2 under Regulation Bureau, 1 under Approval Bureau).
- **Composite Risk & Scrutiny Score**: Real-time calculation based on open high-severity complaints, repeated violations, and overdue compliance responses.
- **Cross-Bureau Case History**: Searchable archive of all historical complaints, disposal justifications, penalties imposed, and show-cause notices issued.

---

## 4. Cross-Bureau Overlap Detection Engine

A cornerstone requirement is automated cross-bureau overlap detection to prevent duplicate, conflicting, or split investigations.

The system utilizes a 3-tier explainable heuristic model:

### Layer 1: Deterministic Key Match (Exact)
- Identical statutory Institution Permanent ID (`permanentId`).
- Identical external complaint registration or petitioner reference numbers.
- Pre-existing explicit parent-child or related-case associations.

### Layer 2: Rule-Based Contextual Similarity
- Same institution + overlapping grievance category (e.g., `Financial Irregularities` and `Capitation Fee/Fee Violation`).
- Incident or filing date within a configurable rolling temporal window (e.g., $\le 60$ days).
- Matching petitioner identity or target department (e.g., Computer Science Department, Head of Administration).

### Layer 3: Lexical & Semantic Text Similarity
- Normalized character n-gram and Jaccard token overlap between complaint titles and primary allegations.
- Tokenized stop-word removal, keyword extraction (e.g., `withholding marksheets`, `salary arrears`, `unapproved intake`, `biometric attendance`).
- Returns a confidence score from $0\%$ to $100\%$ alongside an explicit **Explanation Matrix** (e.g., *"Matched 84% on keywords: faculty salary, 7th pay commission, delayed arrears at Institute #1-3049182 under RB and PGRC"*).

### Safety & Due Process Safeguards
- **Zero Auto-Merge / Zero Auto-Close**: The engine never silently merges or closes cases.
- **Human-in-the-Loop Review**: Suggested matches generate a structured review prompt. An authorized officer from either bureau reviews the evidence side-by-side and makes one of three immutable determinations:
  1. **Confirm as Related / Linked Case**: Cases remain independent records but cross-reference each other in their timeline and dossier.
  2. **Initiate Cross-Bureau Coordination**: Triggers a joint inquiry docket where both bureaus share evidence and align compliance deadlines.
  3. **Dismiss as Unrelated**: Records the reasoning (e.g., *"Case A is an individual student refund dispute, Case B is an institutional infrastructure safety complaint"*), preventing endless re-alerting.

---

## 5. End-to-End Case Lifecycle & Enforcement Engine

```
[Complaint Intake] 
       ↓
[Case Registration & Intake Scrutiny]
       ↓
[Bureau / Cell Assignment (e.g., RB / PGRC)]
       ↓
[Automated Overlap Detection & Review]
   ├── No Match → Standard Processing
   └── Potential Overlap → Cross-Bureau Review & Joint Coordination Docket
       ↓
[Investigation, Evidence Upload & Scrutiny]
       ↓
[Show Cause Notice / Institutional Response Tracking]
       ↓
[Transfer / Escalation (if authorized)]
       ↓
[Disposal / Decision with Justification & Penalty/Relief Order]
       ↓
[Authorized Closure / Reopening on Proven Grounds]
```

### Server-Enforced State Machine
Permitted transitions are strictly validated on the backend. No user can bypass state rules via raw API calls.
- `RECEIVED` $\rightarrow$ `ASSIGNED`
- `ASSIGNED` $\rightarrow$ `UNDER_PROCESS`
- `UNDER_PROCESS` $\rightarrow$ `PENDING_RESPONSE` | `COORDINATION_REQUESTED` | `TRANSFERRED` | `ESCALATED`
- `PENDING_RESPONSE` $\rightarrow$ `UNDER_PROCESS` | `ESCALATED`
- `UNDER_PROCESS` | `COORDINATION_REQUESTED` $\rightarrow$ `DISPOSED`
- `DISPOSED` $\rightarrow$ `CLOSED` | `REOPENED` (Admin authorization only)

---

## 6. Regulatory Audit & Security Framework

1. **Immutable Audit Trail**: Every status change, assignment update, document access, and overlap adjudication is cryptographically sequenced and stamped with user ID, role, IP address, timestamp, and before/after state diff.
2. **Access Control**: Role-Based Access Control (RBAC) enforced on every API route and database query. Officers can only edit cases within their authorized Bureau or shared joint-coordination dockets.
3. **Sensitive Record Privacy**: Whistleblower and petitioner personal identifiers can be redacted or restricted to authorized vigilance officers to prevent retaliation by institution administrations.
4. **Data Integrity**: Soft deletions with preservation of evidentiary records; permanent deletion is disabled in operational environments.
