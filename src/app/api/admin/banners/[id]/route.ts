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
    const { imageUrl, link, isActive, orderIndex } = await request.json();
    const bannerId = parseInt(id);

    // Verify ownership
    const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const updated = await prisma.banner.update({
      where: { id: bannerId },
      data: { imageUrl, link, isActive, orderIndex }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating banner' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const bannerId = parseInt(id);

    // Verify ownership
    const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.banner.delete({ where: { id: bannerId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting banner' }, { status: 500 });
  }
}
