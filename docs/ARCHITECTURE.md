# System Architecture & Technical Specification

**System Name**: CaseConnect  
**Architecture Style**: Decoupled RESTful Full-Stack Architecture  
**Execution Topology**: Node.js / Express Application Server + MongoDB Enterprise Document Store (with Mongoose) + Vanilla/Modern Responsive Front-End Architecture  

---

## 1. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                            CLIENT PRESENTATION TIER                               |
|                                                                                   |
|  [ Modern Web Client - HTML5 / Modern JS / Tailwind Utility & CampusX Theme ]     |
|   ├── Central Dashboard (Executive KPIs, Real Charts, Activity Ticker)             |
|   ├── All Cases Registry (Deep Filters, Sorting, Server Pagination)               |
|   ├── Case Dossier & Timeline (Full Action History, Remarks, Transitions)         |
|   ├── Institution 360° Profile (Unified cross-bureau view, Risk Ledger)           |
|   ├── Bureaus & Workload Directory (RB, PGRC, AB, PAPB Capacity)                  |
|   ├── Cross-Bureau Overlap Engine (Layer 1, Layer 2, Layer 3 Similarity UI)       |
|   ├── Ageing & Escalation Matrix (0-7d, 8-15d, 16-30d, >30d Overdue Tracking)     |
|   ├── Reports & Analytics (Data Export CSV, Printable Layouts)                    |
|   ├── Audit Trail & User/Role Governance                                          |
+-----------------------------------------------------------------------------------+
                                        | (HTTPS / RESTful JSON / Bearer JWT)
                                        v
+-----------------------------------------------------------------------------------+
|                              BACKEND API APPLICATION                              |
|                                                                                   |
|  [ Express.js REST API Server - Port 5000 / Configurable ]                        |
|   ├── Security Middleware: Helmet, CORS, RateLimiting, Sanitization               |
|   ├── Authentication: JWT Token Verification, PBKDF2/Bcrypt Password Hashing       |
|   ├── RBAC Middleware: Strict Endpoint Role/Permission Validation                 |
|   │                                                                               |
|   ├── Core Business Engines:                                                      |
|   │    ├── Overlap Detection Engine (Exact, Categorical, Jaccard Token Matrix)   |
|   │    ├── Case Workflow & State Transition Engine (Validates State Invariants)   |
|   │    ├── Ageing & Deadline SLA Escalation Scheduler                             |
|   │    ├── Notification & Alert Dispatcher (In-App Event Queuing)                 |
|   │    └── Immutable Audit Logger (Captures Actor, IP, Diff, Event)              |
|   │                                                                               |
|   ├── Modular Route Controllers:                                                  |
|   │    /api/auth, /api/cases, /api/institutions, /api/bureaus,                   |
|   │    /api/overlaps, /api/notifications, /api/reports, /api/users,               |
|   │    /api/audit, /api/config                                                    |
+-----------------------------------------------------------------------------------+
                                        | (Mongoose ODM / Native Driver)
                                        v
+-----------------------------------------------------------------------------------+
|                                 DATA STORAGE TIER                                 |
|                                                                                   |
|  [ MongoDB Database - mongodb://localhost:27017/caseconnect ]                     |
|   ├── Collections: users, institutions, bureaus, cases, overlap_reviews,           |
|   │                coordination_requests, notifications, audit_logs, configs      |
|   ├── Resilient Embedded Engine: Auto-fallback in-memory store if DB starting     |
|   ├── Indexed Compound Keys: permanentId, status, bureauId, complaintDate         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Cross-Bureau Overlap Detection Logic

The overlap detection engine runs whenever a new complaint is registered or modified:
1. **Target Discovery**: Filters all active or recent cases concerning the same `institutionId` (or matching `permanentId`).
2. **Layer 1 (Exact Match)**:
   - Same `permanentId` + same `externalReference` or previously marked relation $\rightarrow$ Confidence: $100\%$.
3. **Layer 2 (Rule-Based Overlap)**:
   - Different bureau + same/overlapping category + incident date within 60 days $\rightarrow$ Base score: $+50\%$.
4. **Layer 3 (Text & Title Similarity)**:
   - Tokenize title & description, normalize case, strip punctuation, filter stop-words.
   - Computes Jaccard Coefficient and N-gram overlap:
   $$\text{Similarity}(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
   - Added score: up to $+50\%$.
5. **Threshold & Action Trigger**:
   - If total confidence $\ge 40\%$, an `OverlapDetection` record is created with `status: PENDING_REVIEW`.
   - Explanations list matched tokens, category intersections, and bureau identities.
   - An in-app alert is routed to officers of both Bureaus.

---

## 3. Workflow State Transition Rules

The server enforces legitimate transitions:
```javascript
const ALLOWED_TRANSITIONS = {
  RECEIVED: ['ASSIGNED', 'DISPOSED'],
  ASSIGNED: ['UNDER_PROCESS', 'TRANSFERRED', 'DISPOSED'],
  UNDER_PROCESS: ['PENDING_RESPONSE', 'COORDINATION_REQUESTED', 'TRANSFERRED', 'ESCALATED', 'DISPOSED'],
  PENDING_RESPONSE: ['UNDER_PROCESS', 'ESCALATED', 'DISPOSED'],
  COORDINATION_REQUESTED: ['UNDER_PROCESS', 'DISPOSED', 'TRANSFERRED'],
  TRANSFERRED: ['ASSIGNED', 'UNDER_PROCESS'],
  ESCALATED: ['UNDER_PROCESS', 'DISPOSED'],
  DISPOSED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'] // Admin only
};
```
Attempting an invalid transition returns HTTP 400 with a detailed error payload and logs a security violation attempt.
