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
