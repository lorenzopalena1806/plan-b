const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'DRIVER' }
  });
  console.log('Driver users:', users);
  
  const drivers = await prisma.driver.findMany({
    include: { user: true }
  });
  console.log('Drivers:', drivers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
