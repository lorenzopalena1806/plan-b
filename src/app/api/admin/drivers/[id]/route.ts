import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, phone, isActive } = await request.json();

    const driverId = parseInt(id);

    // Verify ownership
    const existing = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: { name, phone, isActive }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating driver' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const driverId = parseInt(id);

    // Verify ownership
    const existing = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.driver.delete({ where: { id: driverId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting driver' }, { status: 500 });
  }
}
