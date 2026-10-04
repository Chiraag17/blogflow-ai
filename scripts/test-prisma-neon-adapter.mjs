import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('No DATABASE_URL set');
  process.exit(1);
}

console.log('Testing PrismaClient with PrismaNeon adapter...');

const adapter = new PrismaNeon({
  connectionString: dbUrl,
});
const prisma = new PrismaClient({ adapter });

try {
  const start = Date.now();
  const result = await prisma.user.findFirst();
  const elapsed = Date.now() - start;
  console.log(`✅ SUCCESS in ${elapsed}ms! User found:`, result?.id, result?.email);

  const websiteCount = await prisma.website.count();
  console.log(`✅ Website count:`, websiteCount);
} catch (err) {
  console.error('❌ Prisma adapter error:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
