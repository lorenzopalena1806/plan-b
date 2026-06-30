const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { 
      restaurantId: 6,
      isActive: true
    },
    include: {
      category: true
    }
  });
  console.log(`Found ${products.length} active products for restaurant 6.`);
  if (products.length > 0) {
    console.log('Sample product:', products[0].name, 'Category:', products[0].category?.name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
