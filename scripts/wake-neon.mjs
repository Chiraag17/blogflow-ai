const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('No DATABASE_URL found');
  process.exit(1);
}

const parsed = new URL(dbUrl);
const endpoint = `https://${parsed.hostname}/sql`;

console.log(`Waking up Neon compute via HTTP proxy: ${endpoint}...`);

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': dbUrl,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: 'SELECT 1 as wakeup' }),
  });

  const data = await response.json();
  console.log('Neon HTTP Wakeup response:', data);
} catch (err) {
  console.error('Neon Wakeup error:', err.message);
}
