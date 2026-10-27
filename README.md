# CaseConnect — AICTE Integrated Institution Complaint Monitoring & Status Dashboard

CaseConnect is an enterprise regulatory web platform designed for monitoring, tracking, and coordinating AICTE-approved technical education institution complaints across regulatory bureaus (Regulation Bureau, Public Grievance Redressal Cell, Approval Bureau, Policy Bureau, and Chief Vigilance Cell).

---

## 1. Architecture & Technology Stack

- **Frontend**: HTML5, Modern ES6+ Modular JavaScript, Standard CSS Design System (custom variables, responsive media queries, flexbox/grid layout, and zero external CSS runtime dependencies), Enterprise Design System inspired by the CampusX layout (clean elevated cards, sticky navigation header, Ctrl+K quick search, accessible modals, and status badges).
- **Backend**: Node.js, Express.js REST API with Vercel Serverless Function compatibility, Centralized Error Handling, JWT Bearer Authentication, Strict RBAC Middleware, Security Headers.
- **Database**: **Supabase PostgreSQL** via transaction pooler (`pg` Pool), schema migrations with Row Level Security (RLS) policies, foreign keys, triggers, and JSONB document support.
- **Security**: Bcrypt password hashing, JWT authentication, Supabase Row Level Security (RLS) policies, OWASP security protections, immutable audit trail, input validation, and role-based route guards.
- **Hosting & Deployment**: Configured and production-ready for **Vercel** serverless hosting with static frontend caching and dynamic `/api/*` serverless routing.

---

## 2. Supabase PostgreSQL Schema & Models

All models and schemas are located in `backend/models/` and backed by Supabase PostgreSQL:
1. **`Student.js`**: Dedicated student and portal user profiles (Students, Faculty, Stakeholders, Institution Reps).
2. **`Bureau.js`**: Regulatory bureaus, jurisdiction scopes, and statutory capacity limits.
3. **`Institution.js`**: Technical institutions, statutory permanent IDs, intake, location, and risk scores.
4. **`User.js`**: Official staff profiles, employee IDs, hashed credentials, and role assignments (`SUPER_ADMIN`, `BUREAU_OFFICER`, `REGIONAL_REVIEWER`, `INSTITUTION_USER`).
5. **`Case.js`**: Comprehensive complaint dockets, SLA deadlines, petitioner data, timeline events, remarks, and documents.
6. **`OverlapReview.js`**: 3-layer cross-bureau overlap detection records with confidence scores and human review determinations.
7. **`CoordinationRequest.js`**: Inter-bureau joint coordination dockets and action notes.
8. **`Notification.js`**: Automated SLA warnings, overdue alerts, and cross-bureau notifications.
9. **`AuditLog.js`**: Immutable security audit ledger tracking all critical state changes.
10. **`SystemConfig.js`**: Configurable SLA thresholds and workflow rules.

---

## 3. Quick Start & Execution

### Option 1: Double-Click Launcher (Windows)
Double-click `start.bat` in the project root. It will verify dependencies and launch the server at `http://localhost:5000`.

### Option 2: Terminal Execution
```bash
# 1. Navigate to project root
cd "C:\Users\Yuvraj\OneDrive\Desktop\Case Connect"

# 2. Optional: seed local demo accounts (refuses remote databases)
npm run seed:demo

# 3. Launch the platform
npm start
```
The server will start at **`http://localhost:5000`** and automatically serve the web interface.

---

## 4. Configuring Supabase PostgreSQL Connection

CaseConnect connects directly to Supabase PostgreSQL using connection pooling (recommended for Vercel serverless):

1. Set the following environment variables in `backend/.env` or in Vercel Project Settings:
   ```env
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=*
   
   # Supabase Transaction Pooler connection string
   DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_ENCODED_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
   
   # Application Security
   JWT_SECRET=generate_a_unique_random_secret_with_at_least_32_bytes
   SESSION_EXPIRY=12h
   ```

2. **Schema & RLS Policies**:
   - `docs/schema.sql`: Full DDL schema for all tables, indexes, and updated_at triggers.
   - `backend/migrations/001_enable_rls_and_policies.sql`: Enables Row Level Security (RLS) across all 10 tables and establishes least-privilege policies.

---

## 5. Vercel Production Deployment

CaseConnect is pre-configured for one-click deployment to Vercel:

1. Push your repository to GitHub or GitLab.
2. In Vercel, click **Add New Project** and select the repository.
3. Configure the **Environment Variables** in Vercel:
   - `DATABASE_URL` (Supabase Transaction Pooler URL, port `6543`)
   - `JWT_SECRET`
   - `NODE_ENV` (`production`)
4. Click **Deploy**. Vercel will build the project using `vercel.json` and serve the static SPA with serverless `/api/*` handlers.

---

## 6. Local Development Accounts

Local development demo accounts can be created with `npm run seed:demo` only against a local database. Production runtimes and remote database targets are blocked from seeding default credentials. Use organization-managed credentials for deployed environments.

## 7. Verification & Automated Testing

Run the automated test suites to verify system integrity:
```bash
# 1. Critical scenarios & startup safety checks (25 scenarios)
npm test

# 2. Live server, end-to-end API, registration, login, and RBAC checks (15 e2e tests)
node tests/testLiveServer.js

# 3. User auth extension tests (Faculty, Stakeholder, Inst Rep roles) (33 tests)
node tests/userAuthExtension.test.js

# 4. Production build asset verification
npm run build
```
