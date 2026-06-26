import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const restaurants = await prisma.restaurant.findMany({ include: { configs: true } });
    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    const products = await prisma.product.findMany({ include: { modifiers: true } });
    const modifiers = await prisma.modifierOption.findMany();
    const systemConfigs = await prisma.systemConfig.findMany();

    const backupData = {
      exportedAt: new Date().toISOString(),
      restaurants,
      users,
      categories,
      products,
      modifiers,
      systemConfigs,
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Error exporting database backup:', error);
    return NextResponse.json({ error: 'Error al exportar la base de datos' }, { status: 500 });
  }
}
