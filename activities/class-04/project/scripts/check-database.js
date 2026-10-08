// npm run db:check — verifies the connection and the expected schema.
// Prints the database name and the state of the two tables. Never prints the
// connection string or any credential: the URL stays in .env and in the clipboard.
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('FAIL: DATABASE_URL is missing. Copy .env.example to .env and paste your Supabase Session pooler URL there.');
  process.exit(1);
}

const pool = new Pool({ connectionString, connectionTimeoutMillis: 10000 });

function report(label, detail) {
  console.log(`- ${label}${detail ? `: ${detail}` : ''}`);
}

try {
  const db = await pool.query('SELECT current_database() AS name, current_user AS role');
  report('Database reached', `${db.rows[0].name}`);

  const tables = await pool.query(
    `SELECT t.table_name
       FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name IN ('requests', 'request_status_history')
      ORDER BY t.table_name`
  );
  const found = tables.rows.map((r) => r.table_name);
  for (const expected of ['requests', 'request_status_history']) {
    report(expected, found.includes(expected) ? 'present' : 'MISSING (run migrations)');
  }

  if (found.includes('requests')) {
    const requests = await pool.query('SELECT COUNT(*)::int AS n FROM requests');
    report('requests count', String(requests.rows[0].n));
  }
  if (found.includes('request_status_history')) {
    const history = await pool.query('SELECT COUNT(*)::int AS n FROM request_status_history');
    report('status history count', String(history.rows[0].n));
  }

  console.log('db:check OK');
  process.exitCode = 0;
} catch (error) {
  // Fail with a safe description; the real message (hosts, ciphers, SSL hints)
  // goes to the server log, never to the client.
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}