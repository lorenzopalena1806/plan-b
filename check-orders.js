const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: 'READY', deliveryMethod: 'TAKEAWAY' }
  });
  console.log("Ready takeaway orders:", orders);
}

main().finally(() => prisma.$disconnect());
