const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.count({
    where: { restaurantId: 6 }
  });
  console.log(`Vecchio has ${products} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

main().catch(console.error).finally(() => prisma.$disconnect());
