import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Restaurando acceso SuperAdmin...');

  // 1. Encriptar contraseña
  const hashedPassword = await bcrypt.hash('programador123', 10);

  // 2. Crear superadmin (si no existe)
  const user = await prisma.user.upsert({
    where: { username: 'programador' },
    update: {},
    create: {
      username: 'programador',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('✅ Superadmin restaurado exitosamente:');
  console.log(`Usuario: ${user.username}`);
  console.log(`Rol: ${user.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error al restaurar superadmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
