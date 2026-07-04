import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const tableId = parseInt(id);

    const data = await request.json();
    const { action, paymentMethod, paymentDetails } = data;

    if (action === 'CLOSE') {
      // Find all active orders for this table
      const activeOrders = await prisma.order.findMany({
        where: {
          tableId,
          restaurantId: session.user.restaurantId,
          status: { notIn: ['COMPLETED', 'REJECTED'] }
        }
      });

      // Update orders to COMPLETED
      for (const order of activeOrders) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            paymentMethod: paymentMethod || 'CASH',
            paymentDetails: paymentDetails || null
          }
        });
      }

      // Set table to FREE
      const table = await prisma.table.update({
        where: { id: tableId, restaurantId: session.user.restaurantId },
        data: { status: 'FREE' }
      });

      return NextResponse.json(table);
    }
    
    if (action === 'OPEN') {
       const table = await prisma.table.update({
        where: { id: tableId, restaurantId: session.user.restaurantId },
        data: { status: 'OCCUPIED' }
      });
      return NextResponse.json(table);
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const tableId = parseInt(id);

    await prisma.table.delete({
      where: { id: tableId, restaurantId: session.user.restaurantId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
