import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const restId = parseInt(id);

    // Delete restaurant (cascades should be configured in Prisma, otherwise we might need manual deletions depending on schema)
    // The simplest way to handle this without knowing full cascade is to just try deleting.
    // If it fails due to foreign keys, the user might need to delete orders/users first.
    // But since the schema has onDelete: Cascade for most things, this should work.
    await prisma.restaurant.delete({
      where: { id: restId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el local (puede que tenga pedidos vinculados).' }, { status: 500 });
  }
}

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
