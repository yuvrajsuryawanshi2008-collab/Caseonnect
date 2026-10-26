# CaseConnect — Centralized Institution Complaint & Regulatory Monitoring Platform

CaseConnect is an enterprise regulatory web platform designed for monitoring, tracking, and coordinating technical education institution complaints across regulatory bureaus (Regulation Bureau, Public Grievance Redressal Cell, Approval Bureau, Policy Bureau, and Chief Vigilance Cell).

---

## 1. Architecture & Technology Stack

- **Frontend**: HTML5, Modern ES6+ Modular JavaScript, Tailwind CSS utility layer, Enterprise Design System inspired by the CampusX layout (clean elevated cards, sticky navigation header, Ctrl+K quick search, accessible modals, and status badges).
- **Backend**: Node.js, Express.js REST API, Centralized Error Handling, JWT Bearer Authentication, Strict RBAC Middleware, Security Headers.
- **Database**: **MongoDB (Campus Database)** with Mongoose schemas, indexes, and automated embedded local daemon fallback (`mongodb-memory-server`) for zero-configuration local development.
- **Security**: Bcrypt password hashing, JWT authentication, OWASP security protections, immutable audit trail, input validation, and role-based route guards.

---

## 2. MongoDB Models & Schemas

All schemas, relationships, indexes, and validation rules are located in `backend/models/`:
1. **`Bureau.js`**: Regulatory bureaus, jurisdiction scopes, and statutory capacity limits.
2. **`Institution.js`**: Technical institutions, statutory permanent IDs, intake, location, and risk scores.
3. **`User.js`**: Official profiles, employee IDs, hashed credentials, and role assignments (`SUPER_ADMIN`, `BUREAU_OFFICER`, `REGIONAL_REVIEWER`, `INSTITUTION_USER`).
4. **`Case.js`**: Comprehensive complaint dockets, SLA deadlines, petitioner data, timeline events, remarks, and documents.
5. **`OverlapReview.js`**: 3-layer cross-bureau overlap detection records with confidence scores and human review determinations.
6. **`CoordinationRequest.js`**: Inter-bureau joint coordination dockets and action notes.
7. **`Notification.js`**: Automated SLA warnings, overdue alerts, and cross-bureau notifications.
8. **`AuditLog.js`**: Immutable security audit ledger tracking all critical state changes.
9. **`SystemConfig.js`**: Configurable SLA thresholds and workflow rules.

---

## 3. Quick Start & Execution

### Option 1: Double-Click Launcher (Windows)
Double-click `start.bat` in the project root. It will verify dependencies and launch the server at `http://localhost:5000`.

### Option 2: Terminal Execution
```bash
# 1. Navigate to project root
cd "C:\Users\Yuvraj\OneDrive\Desktop\Case Connect"

# 2. Install backend dependencies (if first time)
cd backend
npm install
cd ..

# 3. Seed demo accounts & benchmark data
npm run seed:demo

# 4. Launch the platform
npm start
```
The server will start at **`http://localhost:5000`** and automatically serve the web interface.

---

## 4. Configuring Your MongoDB Campus Database

To connect to your existing MongoDB Campus cluster or local instance:
1. Open `backend/.env` (or root `.env`).
2. Set `MONGODB_URI`:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=*
   
   # For local MongoDB Campus:
   MONGODB_URI=mongodb://127.0.0.1:27017/caseconnect
   
   # Or for remote MongoDB Campus cluster:
   # MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/caseconnect?retryWrites=true&w=majority
   
   JWT_SECRET=caseconnect_production_jwt_secret_key_2026_regulatory
   SESSION_EXPIRY=12h
   ```
3. Restart the server (`npm start`). CaseConnect connects directly to the specified database.
4. *Self-Healing Development Mode*: If local `mongod` is not running on port 27017 and no remote URI is configured, the system automatically starts an in-memory embedded MongoDB daemon (`mongodb-memory-server`), ensuring the application and all tests work out of the box.

---

## 5. Resolution of API HTTP 405 Method Not Allowed

The root causes of HTTP 405 Method Not Allowed have been resolved:
1. **Dynamic Frontend API Base URL**: `frontend/js/config.js` dynamically detects the running port. If opened on VS Code Live Server (`:5500`), Vite (`:5173`), or `file://`, requests are automatically routed to `http://localhost:5000/api` rather than being handled by static web servers (which reject POST/PUT with 405).
2. **CORS Preflight & Options**: Full CORS preflight handling (`app.options('*', cors())`) and allowed headers are configured on Express.
3. **Structured JSON Errors**: When an unsupported HTTP method is called on an API route, Express returns a valid JSON error `{ success: false, error: "Method Not Allowed", message: "..." }` instead of HTML.
4. **Deployment Rewrites**: `vercel.json` and `frontend/_redirects` are included to route `/api/*` directly to `backend/server.js` on cloud deployment platforms.

---

## 6. Authorized Demo Accounts (Explore All Tabs & Roles)

You can seed or reseed all demo accounts and benchmark records anytime by running:
```bash
npm run seed:demo
```

The platform is pre-provisioned with authorized test accounts for every application role:

| Role | Email | Password | Primary Accessible Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@caseconnect.gov.in` | `Admin@2026!` | Global governance, Users, Audit Logs, Workflow SLA settings, All Bureaus |
| **PGRC Officer** | `pgrc.officer@caseconnect.gov.in` | `Officer@2026!` | Public Grievance Redressal Cell cases, assignments, reports |
| **RB Officer** | `rb.officer@caseconnect.gov.in` | `Officer@2026!` | Regulation Bureau cases, norms compliance, institutional scrutiny |
| **Reviewer / Coordinator** | `reviewer@caseconnect.gov.in` | `Reviewer@2026!` | Cross-bureau overlap review adjudication, joint coordination requests |
| **Institution User** | `institution@caseconnect.gov.in` | `Institution@2026!` | Authorized institution 360° profile, related matters, compliance responses |

> [!TIP]
> On the login page (`http://localhost:5000/#/login`), you can click any of the **Authorized Test Credentials** buttons to instantly autofill credentials and sign into the console.

---

## 7. Verification & Automated Testing

Run the test suites to verify system integrity:
```bash
# Critical scenarios & architectural integrity checks (16 tests)
node tests/criticalScenarios.test.js

# Live server, end-to-end API, demo account authentication, and 405 checks (12 tests)
node tests/testLiveServer.js
```
