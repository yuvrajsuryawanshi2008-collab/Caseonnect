# CaseConnect deployment

## Architecture

The Express backend uses the Node.js `pg` driver against the Supabase **Transaction Pooler** (port `6543`). The browser never receives PostgreSQL credentials, the service-role key, or `JWT_SECRET`.

Local secrets belong in the Git-ignored files `backend/.env` and `.env`. Use `.env.example` and `backend/.env.example` for variable names only.

## Connection variables

Use `DATABASE_URL` for the simplest setup. The backend also supports discrete `PG*` variables; `DATABASE_URL` takes precedence if both configurations are present.

| Variable | Where | Value |
| --- | --- | --- |
| `DATABASE_URL` | Vercel + local `.env` | Supabase Transaction Pooler URL on port `6543` |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | optional alternative | Discrete connection settings; `DATABASE_URL` takes precedence if both are set |
| `PGSSL_CA_CERT` | Vercel (PEM contents) | Project CA from Supabase **Database Settings → SSL Configuration** |
| `PGSSL_CA_CERT_PATH` | local only | Path to the same PEM file |
| `JWT_SECRET` | Vercel + local `.env` | Unique secret, at least 32 bytes |
| `NODE_ENV` | Vercel | `production` |
| `FRONTEND_URL` | only if the UI is on another origin | otherwise omit or `*` |

If the password contains reserved URL characters, percent-encode the username and password **separately** (`encodeURIComponent` on each component). Do not encode the entire URI. Do not double-encode values that already contain `%`.

Never put database credentials in `NEXT_PUBLIC_*`, frontend JS, screenshots, Git commits, or docs.

`PORT` is assigned by Vercel. Do not set `PGSSL_REJECT_UNAUTHORIZED=false` in production or on Vercel.

## TLS

Production requires certificate verification. The repo includes `backend/certs/supabase-prod-ca-2021.crt` (Supabase Root/Intermediate 2021 CA). The Node `pg` pool loads that CA by default and sets `rejectUnauthorized: true`. Optionally set `PGSSL_CA_CERT` on Vercel to the PEM contents. Do not disable certificate verification.

On Vercel the pool uses `max: 1` and idle exit so Transaction Pooler / pgbouncer limits are respected. Application queries use unnamed parameterized statements, which are compatible with transaction mode.

## Schema

Inspect the live database before changing it. Application tables are defined in `docs/schema.sql` (`CREATE TABLE IF NOT EXISTS` only). On first connect, if `public.users` is missing, the backend applies that file additively. It does not drop tables or truncate data.

If you are pointing at a **new empty** Supabase project, you may also run `docs/schema.sql` in the SQL Editor, then `backend/migrations/001_enable_rls_and_policies.sql` and `backend/migrations/002_lock_down_credential_tables.sql`. Do not rerun destructive SQL against a populated database.

The Express API connects as the Postgres role and bypasses RLS (RLS is not `FORCE`d). Migration 002 revokes Data API (`anon` / `authenticated`) access to credential tables.

## Authentication

Official sign-in posts to `POST /api/auth/login`. Portal users use `POST /api/auth/user/login` (fallback `POST /api/auth/student/login`). Passwords are bcrypt-hashed. Public official registration stores `isActive: false` until a Super Admin activates the account.

Demo accounts are seeded only against local development databases; production runtimes and remote database targets refuse to create them. The connected database currently contains active default demo accounts. Disable or replace those credentials before exposing the production site; doing so changes live account access and requires an approved operator action. Rotate any database password exposed in chat or tracked files, then update the ignored `.env` files and Vercel `DATABASE_URL`.

The SIH prototype login pages intentionally display one shared official demo credential and one shared student demo credential, including passwords, with fill buttons. Treat these as public credentials. Deploy that prototype only with synthetic data in an isolated demo database. Remove the public credential cards and rotate/deactivate the sample accounts before using real or production data.

## Deploy on Vercel

1. Push the repository. Confirm `.env`, `backend/.env`, and `.backup*` are not committed (`git check-ignore -v backend/.env`).
2. Import the project with repository root as **Root Directory** and framework preset **Other**.
3. Build command: `npm run build`. Do not set an output directory. `vercel.json` routes `/api/*` to `backend/server.js` and serves `frontend` assets.
4. Set the environment variables in the table above for Production (and Preview if it should use the same database).
5. Deploy.
6. Open `/api/health` and confirm `database.connected` is `true`.
7. Sign in with an approved test account and exercise complaint create / list / status update.

Manual remaining step if this environment cannot deploy: log into Vercel, paste the variables, and click Deploy.

## Local verification

```bash
cd backend && npm install
cd ..
node backend/scripts/verifySupabaseConnection.js
npm run build
npm test
npm start
```

Then run `npm run test:e2e` and `npm run test:auth` against `http://localhost:5000`.
