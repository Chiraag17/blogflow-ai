import fs from 'fs';
import { PrismaClient } from '@prisma/client';

console.log('🔍 Checking database environment variables...\n');

// 1. Check DATABASE_URL and LANGGRAPH_CHECKPOINT_DATABASE_URL from process.env
const dbUrl = process.env.DATABASE_URL || '';
const langgraphUrl = process.env.LANGGRAPH_CHECKPOINT_DATABASE_URL || '';

const isDbUrlSet = Boolean(dbUrl && !dbUrl.includes('localhost:5432'));
const isLanggraphUrlSet = Boolean(langgraphUrl && !langgraphUrl.includes('localhost:5432'));

const isDbNeon = dbUrl.includes('neon.tech');
const isLanggraphNeon = langgraphUrl.includes('neon.tech');

console.log('1. Environment Variables:');
console.log(`   • DATABASE_URL: ${isDbUrlSet ? '✅ Available' : '❌ Not set or placeholder'}`);
console.log(`   • DATABASE_URL host: ${isDbNeon ? '✅ Verified Neon PostgreSQL (*.neon.tech)' : '⚠️ Non-Neon or custom host'}`);
console.log(`   • LANGGRAPH_CHECKPOINT_DATABASE_URL: ${isLanggraphUrlSet ? '✅ Available' : '❌ Not set or placeholder'}`);
console.log(`   • LANGGRAPH_CHECKPOINT host: ${isLanggraphNeon ? '✅ Verified Neon PostgreSQL (*.neon.tech)' : '⚠️ Non-Neon or custom host'}`);

if (!isDbUrlSet) {
  console.error('\n❌ DATABASE_URL is not configured properly in .env.local.');
  process.exit(1);
}

import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// 2. Perform safe SELECT 1 ping using Prisma
async function main() {
  console.log('\n2. Testing Neon PostgreSQL connection with Prisma...');
  let prisma;

  if (isDbNeon) {
    if (!neonConfig.webSocketConstructor) {
      neonConfig.webSocketConstructor = ws;
    }
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    prisma = new PrismaClient({ adapter, log: ['error'] });
  } else {
    prisma = new PrismaClient({ log: ['error'] });
  }

  try {
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as ping`;
    const latency = Date.now() - startTime;

    console.log(`   ✅ Successfully executed "SELECT 1" in ${latency}ms.`);
    console.log(`   ✅ Raw ping result:`, result);

    // Safe database and version check without exposing credentials
    const info = await prisma.$queryRaw`SELECT current_database()::text as current_database, version()::text as version`;
    if (Array.isArray(info) && info.length > 0) {
      const dbName = info[0].current_database;
      const pgVersion = info[0].version ? info[0].version.split(' on ')[0] : 'PostgreSQL';
      console.log(`   ✅ Connected Database Name: "${dbName}"`);
      console.log(`   ✅ PostgreSQL Engine: ${pgVersion}`);
    }

    console.log('\n🎉 Neon PostgreSQL is reachable and operational!');
    return true;
  } catch (error) {
    console.error('\n❌ Failed to connect to Neon PostgreSQL:');
    console.error(`   Error message: ${error.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

main().then((ok) => {
  if (!ok) process.exit(1);
});
