import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('No DATABASE_URL set');
  process.exit(1);
}

console.log('Testing connection to Neon via WebSockets (Port 443)...');

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 10000,
});

try {
  const start = Date.now();
  const res = await pool.query('SELECT 1 as ping, current_database() as db, version() as ver');
  const elapsed = Date.now() - start;
  console.log(`✅ SUCCESS in ${elapsed}ms! Result:`, res.rows[0]);
  await pool.end();
} catch (err) {
  console.error('❌ Connection error:', err);
  process.exit(1);
}
