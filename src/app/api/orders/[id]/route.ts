import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order || order.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}
