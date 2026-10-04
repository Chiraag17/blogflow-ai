import { prisma, checkDatabaseConnection } from '../lib/prisma';

async function run() {
  console.log('Testing lib/prisma.ts singleton and checkDatabaseConnection()...');
  const check = await checkDatabaseConnection();
  console.log('Connection check result:', check);

  if (!check.connected) {
    console.error('Failed to connect:', check.error);
    process.exit(1);
  }

  // Test real query
  const websiteCount = await prisma.website.count();
  console.log(`✅ Success! Current website count in Neon: ${websiteCount}`);

  const user = await prisma.user.findFirst();
  console.log(`✅ Success! User found: ${user?.id} (${user?.email})`);
}

run().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
