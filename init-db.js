const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('programador123', 10);
  
  const superadmin = await prisma.user.upsert({
    where: { username: 'programador' },
    update: {},
    create: {
      username: 'programador',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });
  
  console.log('Superadmin created:', superadmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
