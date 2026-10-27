/**
 * Read-only Supabase connection and schema verification.
 * Does not print passwords, connection strings, or credential hashes.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, getPool, encodeDatabaseUrl } = require('../config/db');

function assertNoSecretLeak(text) {
  const haystack = String(text);
  if (/PGPASSWORD|passwordHash|postgresql:\/\//i.test(haystack) && /:[^:@/]+@/.test(haystack)) {
    throw new Error('Refusing to print a value that looks like a credential.');
  }
}

async function main() {
  const encoded = encodeDatabaseUrl(process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    let host = '';
    let port = '';
    try {
      const parsed = new URL(encoded);
      host = parsed.hostname;
      port = parsed.port;
    } catch {
      host = 'unparsed';
    }
    console.log(`[URI] DATABASE_URL host=${host} port=${port} encoded=${Boolean(encoded && encoded.includes('%'))}`);
  }

  await connectDB();
  const pool = getPool();
  const identity = await pool.query('SELECT current_database() AS database, current_user AS user, inet_server_addr()::text AS server_addr');
  const ssl = await pool.query('SHOW ssl');
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const columns = await pool.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('users','students','cases','institutions','bureaus')
    ORDER BY table_name, ordinal_position
  `);
  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM students) AS students,
      (SELECT COUNT(*)::int FROM cases) AS cases,
      (SELECT COUNT(*)::int FROM institutions) AS institutions
  `);

  const summary = {
    database: identity.rows[0].database,
    user: identity.rows[0].user,
    ssl: ssl.rows[0].ssl,
    tables: tables.rows.map((row) => row.table_name),
    counts: counts.rows[0],
    columns: columns.rows.reduce((acc, row) => {
      acc[row.table_name] = acc[row.table_name] || [];
      acc[row.table_name].push(`${row.column_name}:${row.data_type}`);
      return acc;
    }, {})
  };

  const serialized = JSON.stringify(summary, null, 2);
  assertNoSecretLeak(serialized);
  console.log(serialized);
  await pool.end();
}

main().catch((err) => {
  console.error('[verify] failed:', err.message);
  process.exit(1);
});
