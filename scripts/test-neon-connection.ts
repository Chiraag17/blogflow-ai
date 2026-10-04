import fs from 'fs';
import { PrismaClient } from '@prisma/client';

console.log('🔍 Inspecting database configuration in .env.local...\n');

// 1. Check .env.local file & variables presence safely
if (!fs.existsSync('.env.local')) {
  console.error('❌ .env.local file not found.');
  process.exit(1);
}

const content = fs.readFileSync('.env.local', 'utf-8');
const lines = content.split(/\r?\n/);
const envDbUrl = process.env.DATABASE_URL || '';
const envLangUrl = process.env.LANGGRAPH_CHECKPOINT_DATABASE_URL || '';

let dbUrlPresent = false;
let dbUrlIsNeon = false;
let langgraphUrlPresent = false;
let langgraphUrlIsNeon = false;

// Check process.env first (when executed via dotenv -e .env.local)
if (envDbUrl && !envDbUrl.includes('localhost:5432')) {
  dbUrlPresent = true;
  if (envDbUrl.includes('neon.tech')) {
    dbUrlIsNeon = true;
  }
}

if (envLangUrl && !envLangUrl.includes('localhost:5432')) {
  langgraphUrlPresent = true;
  if (envLangUrl.includes('neon.tech')) {
    langgraphUrlIsNeon = true;
  }
}

// Fallback check of file content if process.env wasn't injected
if (!dbUrlPresent || !langgraphUrlPresent) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      const val = trimmed.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
      if (val && !val.includes('localhost:5432')) {
        dbUrlPresent = true;
        if (val.includes('neon.tech')) dbUrlIsNeon = true;
      }
    }
    if (trimmed.startsWith('LANGGRAPH_CHECKPOINT_DATABASE_URL=')) {
      const val = trimmed.slice('LANGGRAPH_CHECKPOINT_DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
      if (val && !val.includes('localhost:5432')) {
        langgraphUrlPresent = true;
        if (val.includes('neon.tech')) langgraphUrlIsNeon = true;
      }
    }
  }
}

console.log('1. Environment Variables:');
console.log(`   • DATABASE_URL: ${dbUrlPresent ? '✅ Available' : '⚠️ Missing or localhost placeholder'}`);
console.log(`   • Points to Neon host: ${dbUrlIsNeon ? '✅ Yes (*.neon.tech)' : '⚠️ No'}`);
console.log(`   • LANGGRAPH_CHECKPOINT_DATABASE_URL: ${langgraphUrlPresent ? '✅ Available' : '⚠️ Missing or localhost placeholder'}`);
console.log(`   • Points to Neon host: ${langgraphUrlIsNeon ? '✅ Yes (*.neon.tech)' : '⚠️ No'}`);

// 2. Perform safe SELECT 1 ping using Prisma
async function testConnection() {
  console.log('\n2. Testing PostgreSQL connection with Prisma (SELECT 1)...');
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    const start = Date.now();
    const result = await prisma.$queryRaw<Array<{ ping: number }>>`SELECT 1 as ping`;
    const latency = Date.now() - start;

    console.log(`   ✅ Query executed successfully in ${latency}ms.`);
    console.log(`   ✅ Result: ${JSON.stringify(result[0])}`);

    // Fetch PostgreSQL server version info safely
    const serverInfo = await prisma.$queryRaw<Array<{ version: string; current_database: string }>>`
      SELECT version(), current_database()
    `;
    if (serverInfo.length > 0) {
      const ver = serverInfo[0].version;
      const db = serverInfo[0].current_database;
      console.log(`   ✅ Connected to database: "${db}"`);
      console.log(`   ✅ Engine details: ${ver.split(' on ')[0]}`);
    }

    return true;
  } catch (err: any) {
    console.error('   ❌ Connection failed:');
    console.error(`      ${err.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().then((success) => {
  if (!success) {
    process.exit(1);
  }
});
