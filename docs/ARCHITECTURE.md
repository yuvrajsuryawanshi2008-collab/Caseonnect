# CaseConnect System Architecture

**Architecture:** Vanilla JavaScript and CSS single page application, Express REST API, Supabase PostgreSQL.

## Runtime

- The existing frontend is served from `frontend/` and calls the same-origin `/api/*` routes.
- `backend/server.js` serves the API and local static frontend. Vercel routes `/api/*` to the Express function and publishes the existing static assets.
- Authentication uses bcrypt password hashes and signed JWT bearer tokens. API route middleware enforces role authorization.
- `backend/config/db.js` creates a `pg` connection pool for Supabase PostgreSQL. `backend/lib/pgModel.js` provides the compatibility methods used by existing model and route code.
- Database credentials remain server-side in ignored environment files or Vercel settings. The frontend never receives them.

## Data model

The PostgreSQL schema is in `docs/schema.sql`; the RLS migrations are in `backend/migrations/`. The ten application tables are `users`, `students`, `bureaus`, `institutions`, `cases`, `overlap_reviews`, `coordination_requests`, `notifications`, `audit_logs`, and `system_configs`.

Complaint timelines, remarks, documents, matching evidence, and audit before/after snapshots use JSONB. Queries are parameterized. RLS prevents direct public access to user/student credential tables; the application accesses PostgreSQL through its private server connection and applies its own JWT/RBAC checks.

## Application services

- Case routes create and read complaints and use the workflow engine for valid status transitions.
- The overlap engine detects potentially related complaints across bureaus.
- The escalation engine calculates SLA age and queues notifications.
- Audit logging records key account and case changes.

The database does not fall back to an in-memory store. `/api/health` reports connection state; database-backed endpoints return HTTP 503 when PostgreSQL is unavailable.

## Deployment

See [`DEPLOYMENT.md`](../DEPLOYMENT.md) for environment variables, Supabase TLS verification, schema/migration status, and Vercel setup.