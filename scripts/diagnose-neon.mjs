// scripts/diagnose-neon.mjs
// Diagnostic script to verify Neon PostgreSQL connectivity, DNS resolution, and Prisma adapter usage.
// Run with: npx dotenv -e .env.local -- node scripts/diagnose-neon.mjs

import { promises as dns } from 'dns';
import net from 'net';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

function logStep(message) {
  console.log(`\n[🔎] ${message}`);
}

async function resolveHostname(hostname) {
  try {
    const addresses = await dns.lookup(hostname);
    console.log('✅ DNS resolved:', addresses.address);
    return true;
  } catch (err) {
    console.error('❌ DNS resolution failed:', err.message);
    return false;
  }
}

function testTcpConnection(host, port = 443, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      console.log('✅ TCP connection successful (port', port, ')');
      socket.destroy();
      resolve(true);
    });
    socket.once('error', (err) => {
      console.error('❌ TCP connection error:', err.message);
      resolve(false);
    });
    socket.once('timeout', () => {
      console.error('❌ TCP connection timed out');
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function testPrisma(dbUrl) {
  if (dbUrl.includes('neon.tech') && !neonConfig.webSocketConstructor) {
    neonConfig.webSocketConstructor = ws;
  }
  const adapter = dbUrl.includes('neon.tech') ? new PrismaNeon({ connectionString: dbUrl }) : undefined;
  const prisma = new PrismaClient({ adapter, log: ['error'] });
  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as ping`;
    console.log('✅ Prisma SELECT 1 succeeded in', Date.now() - start, 'ms', result);
    const info = await prisma.$queryRaw`SELECT version()::text as version`;
    console.log('✅ PostgreSQL version:', info[0].version);
    return true;
  } catch (err) {
    console.error('❌ Prisma query failed:', err.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const langgraphUrl = process.env.LANGGRAPH_CHECKPOINT_DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }
  if (!langgraphUrl) {
    console.error('❌ LANGGRAPH_CHECKPOINT_DATABASE_URL is not set');
    process.exit(1);
  }

  const dbHostMatch = dbUrl.match(/@([^:/]+)[/:]/);
  const lgHostMatch = langgraphUrl.match(/@([^:/]+)[/:]/);
  const dbHost = dbHostMatch ? dbHostMatch[1] : null;
  const lgHost = lgHostMatch ? lgHostMatch[1] : null;

  logStep('Verifying DATABASE_URL hostname');
  await resolveHostname(dbHost);

  logStep('Verifying LANGGRAPH_CHECKPOINT_DATABASE_URL hostname');
  await resolveHostname(lgHost);

  if (dbHost) {
    logStep('Testing TCP connection to DATABASE_URL host (port 443)');
    await testTcpConnection(dbHost, 443);
  }
  if (lgHost) {
    logStep('Testing TCP connection to LANGGRAPH_CHECKPOINT_DATABASE_URL host (port 5432)');
    await testTcpConnection(lgHost, 5432);
  }

  logStep('Testing Prisma connection via adapter');
  await testPrisma(dbUrl);

  console.log('\n🟢 Diagnostic completed. Review the above messages for any failures.');
}

main().catch((e) => {
  console.error('Unexpected error in diagnostic script:', e);
  process.exit(1);
});
