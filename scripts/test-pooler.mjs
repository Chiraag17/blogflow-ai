import { PrismaClient } from '@prisma/client';

async function test() {
  const poolerUrl = 'postgresql://neondb_owner:npg_8ZLRK0dVDHGT@ep-calm-river-b4pmkymh-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30';
  console.log('Testing connection to Neon Pooler...');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: poolerUrl },
    },
  });

  try {
    const res = await prisma.$queryRaw`SELECT 1 as ping`;
    console.log('✅ Connected successfully to Neon pooler! Result:', res);
  } catch (err) {
    console.error('❌ Pooler error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
