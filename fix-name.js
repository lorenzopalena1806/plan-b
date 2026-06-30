const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.restaurant.update({
    where: { id: 3 },
    data: { name: 'Lo del Pela' }
  });
  console.log("Updated restaurant:", updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
