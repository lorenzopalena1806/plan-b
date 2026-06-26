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

    let config = await prisma.systemConfig.findFirst();
    if (!config) {
      config = await prisma.systemConfig.create({
        data: { supportContact: '' }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching SystemConfig:', error);
    return NextResponse.json({ error: 'Error al obtener la configuración' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { supportContact } = await request.json();

    let config = await prisma.systemConfig.findFirst();
    if (config) {
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data: { supportContact }
      });
    } else {
      config = await prisma.systemConfig.create({
        data: { supportContact }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating SystemConfig:', error);
    return NextResponse.json({ error: 'Error al guardar la configuración' }, { status: 500 });
  }
}
