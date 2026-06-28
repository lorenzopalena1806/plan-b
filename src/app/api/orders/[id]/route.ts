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
    const { status, cancelReason, driverId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order || order.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { 
        ...(status !== undefined && { status }),
        ...(cancelReason !== undefined && { cancelReason }),
        ...(driverId !== undefined && { driverId })
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order || order.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Prisma has onDelete: Cascade for OrderItem if correctly modeled.
    // Let's delete the order, which should cascade or we can manually delete items first to be safe.
    await prisma.orderItem.deleteMany({
      where: { orderId: parseInt(id) }
    });

    await prisma.order.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 });
  }
}
