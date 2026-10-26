# API Documentation & Endpoint Specification

**Base URL**: `/api`  
**Authentication**: `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type**: `application/json`  

---

## 1. Authentication & Security Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate official with Email + Password; returns JWT & Profile | Public |
| `GET` | `/api/auth/me` | Fetch active official session, verified permissions, and bureau | Authorized |
| `POST` | `/api/auth/logout` | Invalidate token/session | Authorized |
| `POST` | `/api/auth/change-password` | Update account password with old credential verification | Authorized |

---

## 2. Institution Management (`/api/institutions`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/institutions` | Search institutions with filters (`permanentId`, `region`, `type`, `query`) | Authorized |
| `GET` | `/api/institutions/:id` | Get single institution data | Authorized |
| `GET` | `/api/institutions/:id/profile-360` | Comprehensive 360° dossier: cross-bureau case counts, open complaints, risk score | Authorized |
| `POST` | `/api/institutions` | Register new technical education institution | Admin / Reviewer |
| `PUT` | `/api/institutions/:id` | Update statutory metadata or status | Admin / Reviewer |

---

## 3. Complaint & Case Management (`/api/cases`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cases` | Paginated search across cases (`status`, `bureauId`, `severity`, `institutionId`, `overdue`, `query`) | Authorized |
| `GET` | `/api/cases/:id` | Full case details, chronological timeline, documents, and remarks | Authorized |
| `POST` | `/api/cases` | Register new complaint; automatically runs overlap detection engine | Bureau Officer / Admin |
| `PUT` | `/api/cases/:id` | Update case metadata, priority, or next required action | Case Owner / Admin |
| `POST` | `/api/cases/:id/status` | Execute authorized workflow transition (validates allowed states) | Case Owner / Admin |
| `POST` | `/api/cases/:id/assign` | Assign or reassign case to specific officer | Senior Officer / Admin |
| `POST` | `/api/cases/:id/transfer` | Request/execute case transfer to another Bureau/Cell | Bureau Officer / Admin |
| `POST` | `/api/cases/:id/escalate` | Escalate high-risk / overdue case to Senior Monitoring Authority | Bureau Officer / Admin |
| `POST` | `/api/cases/:id/remarks` | Add internal confidential remark or hearing note | Authorized |
| `POST` | `/api/cases/:id/disposal` | Formally dispose case with justification & penalty/directive | Case Owner / Senior |

---

## 4. Cross-Bureau Overlap Engine (`/api/overlaps`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/overlaps` | List pending and reviewed overlap candidate pairs | Authorized |
| `GET` | `/api/overlaps/check/:caseId` | On-demand overlap scan for a specific case | Authorized |
| `POST` | `/api/overlaps/:id/review` | Record human review determination (`CONFIRMED_RELATED`, `COORDINATION_INITIATED`, `DISMISSED_UNRELATED`) | Senior / Bureau Officer |

---

## 5. Bureaus & Workload Distribution (`/api/bureaus`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bureaus` | List all regulatory bureaus with real-time active case counts and capacity | Authorized |
| `GET` | `/api/bureaus/:id/workload` | Breakdown of officer workload and overdue ratios | Senior / Admin |
| `POST` | `/api/bureaus/coordination` | Dispatch formal cross-bureau coordination request | Bureau Officer / Admin |
| `GET` | `/api/bureaus/coordination` | List open cross-bureau coordination tickets | Authorized |

---

## 6. Reports, Ageing, & Analytics (`/api/reports`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard-stats` | Real-time executive KPIs: Total, Pending, Overdue, Cross-Bureau Overlaps, Trends | Authorized |
| `GET` | `/api/reports/ageing-analysis` | 0-7, 8-15, 16-30, >30 day ageing breakdown | Authorized |
| `GET` | `/api/reports/bureau-performance` | Bureau-wise disposal rates, average resolution time, pending cases | Senior / Auditor |
| `GET` | `/api/reports/export/cases-csv` | Stream filtered cases in standard RFC 4180 CSV format | Authorized |

---

## 7. Notifications (`/api/notifications`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Fetch unread and historical notifications for current official | Authorized |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read | Authorized |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Authorized |

---

## 8. Governance, Users, & Audit (`/api/users`, `/api/audit`, `/api/config`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | List officials, roles, and bureau assignments | Admin / Senior |
| `POST` | `/api/users` | Create authorized official account | Admin |
| `PUT` | `/api/users/:id/toggle-status`| Activate or suspend official access | Admin |
| `GET` | `/api/audit` | Query immutable audit log with filters | Admin / Auditor |
| `GET` | `/api/config/workflow` | Fetch current SLA thresholds, allowed categories, and transition rules | Authorized |
| `PUT` | `/api/config/workflow` | Update system SLA and notification rules | Admin |
