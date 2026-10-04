import { PrismaClient } from '@prisma/client';

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const parsed = new URL(rawUrl);
// keep original direct hostname
parsed.searchParams.set('connection_limit', '5');
parsed.searchParams.set('pool_timeout', '30');
parsed.searchParams.set('connect_timeout', '30');

console.log('Testing connection with:');
console.log('  Host:', parsed.hostname);
console.log('  Params:', parsed.searchParams.toString());

const prisma = new PrismaClient({
  datasources: {
    db: { url: parsed.toString() },
  },
  log: ['warn', 'error'],
});

async function run() {
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as ping`;
    const elapsed = Date.now() - start;
    console.log(`✅ Success! Query returned in ${elapsed}ms:`, result);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
