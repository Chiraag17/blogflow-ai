const { prisma } = require('./lib/prisma');
prisma.$queryRaw`SELECT 1`
  .then(r => console.log('✅ Prisma SELECT 1 ok', r))
  .catch(e => console.error('❌ Prisma error', e));
