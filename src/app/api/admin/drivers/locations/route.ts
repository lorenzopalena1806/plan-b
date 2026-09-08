import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Returns all drivers that updated their location in the last 5 minutes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const drivers = await prisma.driver.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
        locationUpdatedAt: { gte: fiveMinutesAgo }
      },
      select: {
        id: true,
        name: true,
        phone: true,
        latitude: true,
        longitude: true,
        locationUpdatedAt: true
      }
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}