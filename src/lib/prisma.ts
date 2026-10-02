import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Siempre reutilizar la instancia para evitar crear una nueva conexión TCP a Supabase
// en cada invocación de lambda en Vercel (causa cold starts de 5-30s)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

// Guardar en global en TODOS los ambientes (no solo dev)
globalForPrisma.prisma = prisma;
