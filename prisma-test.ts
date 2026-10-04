const { prisma } = require("./lib/prisma");

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Prisma SELECT 1 ok", result);
  } catch (e) {
    console.error("❌ Prisma error", e);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
