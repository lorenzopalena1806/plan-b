import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { isSuspended } = await request.json();

    // Actualizar el Config de este restaurante
    const config = await prisma.config.findFirst({
      where: { restaurantId: parseInt(id) }
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuración no encontrada para este local' }, { status: 404 });
    }

    const updatedConfig = await prisma.config.update({
      where: { id: config.id },
      data: { isSuspended },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el estado de suspensión' }, { status: 500 });
  }
}
