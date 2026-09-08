import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Driver sends their GPS location
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { latitude, longitude } = await request.json();
    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: 'Coordenadas requeridas' }, { status: 400 });
    }

    // Find driver linked to this user
    const driver = await prisma.driver.findFirst({
      where: { userId: parseInt(session.user.id) }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Repartidor no encontrado' }, { status: 404 });
    }

    await prisma.driver.update({
      where: { id: driver.id },
      data: { latitude, longitude, locationUpdatedAt: new Date() }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar ubicacion' }, { status: 500 });
  }
}

// Clear location when driver goes offline
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: parseInt(session.user.id) }
    });

    if (driver) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { latitude: null, longitude: null, locationUpdatedAt: null }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}