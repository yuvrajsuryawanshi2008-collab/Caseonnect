/**
 * CaseConnect — Supabase PostgreSQL Connection (via pg Pool)
 * Configured for resilient local and Vercel serverless execution
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let isConnected = false;
let connectionError = null;
let connectPromise = null;
let schemaReady = false;

function unwrapEnv(value) {
  if (value == null) return value;
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function encodeCredential(value) {
  const raw = unwrapEnv(value);
  if (!raw) return raw;
  try {
    return encodeURIComponent(decodeURIComponent(raw));
  } catch {
    return encodeURIComponent(raw);
  }
}

function encodeDatabaseUrl(raw) {
  const value = unwrapEnv(raw);
  if (!value) return value;

  try {
    const parsed = new URL(value);
    if (parsed.hostname && parsed.username) {
      parsed.username = encodeCredential(parsed.username);
      if (parsed.password) parsed.password = encodeCredential(parsed.password);
      return parsed.toString();
    }
  } catch {
    // Fall through to last-@ parsing so unencoded '/' in the password cannot be treated as the path.
  }

  const match = value.match(/^(postgres(?:ql)?):\/\/([^:/?#]+):(.+)@([^:/?#]+):(\d+)\/([^?]*)(.*)?$/s);
  if (!match) return value;
  const [, protocol, user, password, host, port, database, rest = ''] = match;
  return `${protocol}://${encodeCredential(user)}:${encodeCredential(password)}@${host}:${port}/${database}${rest}`;
}

function getSslConfig() {
  const production = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  if (production && process.env.PGSSL_REJECT_UNAUTHORIZED === 'false') {
    throw new Error('PGSSL_REJECT_UNAUTHORIZED=false is only permitted outside production. Configure the Supabase CA certificate instead.');
  }

  let ca = process.env.PGSSL_CA_CERT;
  if (ca) ca = ca.replace(/\\n/g, '\n');
  if (!ca && process.env.PGSSL_CA_CERT_PATH) {
    const candidates = [
      process.env.PGSSL_CA_CERT_PATH,
      path.resolve(process.cwd(), process.env.PGSSL_CA_CERT_PATH),
      path.join(__dirname, '..', '..', process.env.PGSSL_CA_CERT_PATH),
      path.join(__dirname, '..', process.env.PGSSL_CA_CERT_PATH)
    ];
    const caPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (caPath) ca = fs.readFileSync(caPath, 'utf8');
  }
  const bundledCaPath = path.join(__dirname, '..', 'certs', 'supabase-prod-ca-2021.crt');
  if (!ca && fs.existsSync(bundledCaPath)) {
    ca = fs.readFileSync(bundledCaPath, 'utf8');
  }

  if (ca) return { ca, rejectUnauthorized: true };
  return { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' };
}

function buildPoolConfig() {
  const ssl = getSslConfig();
  const pgHost = unwrapEnv(process.env.PGHOST);
  const pgUser = unwrapEnv(process.env.PGUSER);
  const pgPassword = unwrapEnv(process.env.PGPASSWORD);
  const pgDatabase = unwrapEnv(process.env.PGDATABASE) || 'postgres';
  const pgPort = parseInt(unwrapEnv(process.env.PGPORT) || '6543', 10);
  const databaseUrl = encodeDatabaseUrl(process.env.DATABASE_URL);

  const hasDiscrete = Boolean(pgHost || pgUser || pgPassword);
  if (!databaseUrl && (!pgHost || !pgUser || !pgPassword)) {
    throw new Error('Configure DATABASE_URL or all of PGHOST, PGUSER, and PGPASSWORD.');
  }
  if (!databaseUrl && hasDiscrete && (!pgHost || !pgUser || !pgPassword)) {
    throw new Error('PGHOST, PGUSER, and PGPASSWORD must be configured together.');
  }

  const serverless = Boolean(process.env.VERCEL);
  const base = {
    ssl,
    max: serverless ? 1 : 5,
    idleTimeoutMillis: serverless ? 10000 : 30000,
    connectionTimeoutMillis: 15000,
    allowExitOnIdle: serverless,
    keepAlive: !serverless
  };

  // DATABASE_URL takes precedence so one complete connection string can be
  // configured without stale PG* variables overriding its credentials.
  if (databaseUrl) {
    return {
      mode: 'DATABASE_URL',
      config: {
        ...base,
        connectionString: databaseUrl
      }
    };
  }

  // Discrete credentials remain available as a compatibility option.
  if (pgHost) {
    return {
      mode: 'PGHOST',
      config: {
        ...base,
        host: pgHost,
        port: pgPort,
        user: pgUser,
        password: pgPassword,
        database: pgDatabase
      }
    };
  }

  throw new Error('Configure DATABASE_URL or all of PGHOST, PGUSER, and PGPASSWORD.');
}

async function ensureApplicationSchema(activePool) {
  if (schemaReady) return;
  const existing = await activePool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'users'`
  );
  if (existing.rows.length) {
    schemaReady = true;
    return;
  }

  const schemaPath = path.join(__dirname, '..', '..', 'docs', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Application tables are missing and docs/schema.sql was not found.');
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await activePool.query(sql);
  schemaReady = true;
  console.log('[Database] Applied additive application schema from docs/schema.sql.');
}

const connectDB = async () => {
  if (isConnected && pool) return pool;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const { mode, config } = buildPoolConfig();
      console.log(`[Database] Connecting to Supabase PostgreSQL using ${mode} (transaction pooler compatible).`);
      pool = new Pool(config);

      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        const sslState = await client.query('SHOW ssl');
        if (sslState.rows[0] && String(sslState.rows[0].ssl).toLowerCase() !== 'on') {
          throw new Error('Supabase connection is not using TLS.');
        }
      } finally {
        client.release();
      }

      await ensureApplicationSchema(pool);

      isConnected = true;
      connectionError = null;
      console.log('[Database] Supabase PostgreSQL connection established successfully.');

      try {
        const { initializeCoreSystem } = require('../utils/seedData');
        await initializeCoreSystem();
      } catch (seedErr) {
        console.warn('[Database] Core system initialization deferred:', seedErr.message);
      }

      return pool;
    } catch (err) {
      isConnected = false;
      connectionError = err.message;
      connectPromise = null;
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }
      console.error(`[Database Critical Error] Could not connect to Supabase PostgreSQL: ${err.message}`);
      console.error('[Database Resolution] Verify DATABASE_URL or PGHOST, PGUSER, PGPASSWORD, PGDATABASE in backend/.env or Vercel Environment Variables');
      throw err;
    }
  })();

  return connectPromise;
};

const getPool = () => pool;

const closeDB = async () => {
  const activePool = pool;
  pool = null;
  isConnected = false;
  connectPromise = null;
  if (activePool) await activePool.end();
};

const isDbConnected = () => isConnected;

const getDbError = () => connectionError;

// A pool can lose the ability to open new connections after startup (for
// example, if Supabase credentials are rotated). Keep health checks accurate
// and force the next request to retry the configured connection.
const markDbDisconnected = (err) => {
  isConnected = false;
  connectionError = err && err.message ? err.message : 'Database connection failed.';
  connectPromise = null;
  const stalePool = pool;
  pool = null;
  if (stalePool) stalePool.end().catch(() => {});
};

const requireDbConnection = async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
    } catch (e) {
      const authenticationFailed = e.code === '28P01';
      return res.status(503).json({
        success: false,
        message: authenticationFailed
          ? 'Supabase rejected the configured database credentials. Update DATABASE_URL or the PG* settings, then restart the backend.'
          : 'Supabase PostgreSQL database service is currently unavailable. Please verify database credentials in backend/.env or Vercel Environment Variables.',
        databaseStatus: 'DISCONNECTED',
        error: authenticationFailed
          ? 'Database password authentication failed.'
          : 'Database is unavailable. Check the configured Supabase connection settings.'
      });
    }
  }
  next();
};

module.exports = {
  connectDB,
  getPool,
  closeDB,
  isDbConnected,
  getDbError,
  markDbDisconnected,
  getSslConfig,
  requireDbConnection,
  encodeDatabaseUrl,
  unwrapEnv,
  buildPoolConfig
};
