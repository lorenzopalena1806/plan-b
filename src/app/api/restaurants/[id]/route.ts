import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { isSuspended, subscriptionEnd } = await request.json();
    const restId = parseInt(id);

    if (isSuspended !== undefined) {
      const config = await prisma.config.findFirst({
        where: { restaurantId: restId }
      });

      if (config) {
        await prisma.config.update({
          where: { id: config.id },
          data: { isSuspended },
        });
      }
    }

    if (subscriptionEnd !== undefined) {
      await prisma.restaurant.update({
        where: { id: restId },
        data: { subscriptionEnd: subscriptionEnd ? new Date(subscriptionEnd) : null }
      });
    }

    const updatedRestaurant = await prisma.restaurant.findUnique({
      where: { id: restId },
      include: { configs: true }
    });

    return NextResponse.json(updatedRestaurant);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el local' }, { status: 500 });
  }
}
