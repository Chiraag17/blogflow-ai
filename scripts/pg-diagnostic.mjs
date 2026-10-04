import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Configure client with explicit connection timeout (30s) and SSL verification disabled for Neon (requires TLS)
const client = new Client({
  connectionString,
  connectionTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as ping');
    console.log('✅ pg connection succeeded, result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ pg connection failed');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
  }
})();
