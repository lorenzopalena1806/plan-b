import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date'); // YYYY-MM-DD

  let whereClause: any = { restaurantId: session.user.restaurantId };

  if (status) {
    whereClause.status = status;
  }
  
  if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    whereClause.createdAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}

// POST is moved to public API so customers can create orders without session.

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron IDs válidos' }, { status: 400 });
    }

    // Verificamos que todos los pedidos pertenezcan a este restaurante
    const orders = await prisma.order.findMany({
      where: {
        id: { in: ids }
      }
    });

    const invalidOrder = orders.find(o => o.restaurantId !== session.user.restaurantId);
    if (invalidOrder) {
      return NextResponse.json({ error: 'No autorizado para algunos pedidos' }, { status: 403 });
    }

    // Eliminamos items primero para evitar error de foreign key
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: ids } }
    });

    // Eliminamos los pedidos
    await prisma.order.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error en borrado masivo:', error);
    return NextResponse.json({ error: 'Error al eliminar pedidos' }, { status: 500 });
  }
}
