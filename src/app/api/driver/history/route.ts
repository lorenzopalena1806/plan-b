import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId: parseInt(session.user.id) }
    });

    if (!driver) {
      return NextResponse.json({ error: 'No se encontró el perfil de cadete' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 deliveries
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching driver history:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
