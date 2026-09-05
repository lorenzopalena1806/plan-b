const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superadmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, rawPassword: 'admin123', role: 'SUPERADMIN' },
    create: {
      username: 'admin',
      password: hashedPassword,
      rawPassword: 'admin123',
      role: 'SUPERADMIN',
    },
  });

  console.log('Superadmin creado/actualizado exitosamente:', superadmin.username);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
