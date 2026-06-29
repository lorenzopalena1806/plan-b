import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPERADMIN') {
      console.warn('DELETE /api/users/[id] - Unauthorized. Session:', session);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (parseInt(session.user.id) === userId) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    console.log(`DELETE /api/users/[id] - Deleting user ID: ${userId} by SUPERADMIN ID: ${session.user.id}`);

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const userId = parseInt(id);
    const { restaurantId } = await request.json();

    if (!restaurantId) return NextResponse.json({ error: 'Falta restaurantId' }, { status: 400 });

    await prisma.user.update({
      where: { id: userId },
      data: {
        managedRestaurants: {
          connect: { id: parseInt(restaurantId) }
        }
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking restaurant:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
