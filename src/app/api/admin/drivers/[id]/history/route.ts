import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const driverId = parseInt(id);

  try {
    const orders = await prisma.order.findMany({
      where: {
        driverId,
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 for performance
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching driver history:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
