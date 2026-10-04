import pg from 'pg';

const rawUrl = process.env.DATABASE_URL;
const poolerUrl = process.env.LANGGRAPH_CHECKPOINT_DATABASE_URL;

async function test(name, url) {
  if (!url) {
    console.log(`[${name}] No URL configured`);
    return;
  }
  const parsed = new URL(url);
  parsed.port = '443';
  console.log(`[${name}] Host: ${parsed.hostname}, Port: ${parsed.port}`);
  const client = new pg.Client({
    connectionString: parsed.toString(),
    connectionTimeoutMillis: 15000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const start = Date.now();
    await client.connect();
    const res = await client.query('SELECT 1 as ping, current_database() as db');
    const elapsed = Date.now() - start;
    console.log(`[${name}] ✅ SUCCESS in ${elapsed}ms:`, res.rows[0]);
    await client.end();
  } catch (err) {
    console.log(`[${name}] ❌ ERROR:`, err);
  }
}

async function run() {
  await test('DATABASE_URL (Direct)', rawUrl);
  await test('LANGGRAPH_CHECKPOINT_DATABASE_URL (Pooler)', poolerUrl);
}

run();
