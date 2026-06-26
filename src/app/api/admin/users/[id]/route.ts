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
    if (!session || !session.user.restaurantId) {
      console.warn('DELETE /api/admin/users/[id] - Unauthorized. Session:', session);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role === 'STAFF') {
      console.warn(`DELETE /api/admin/users/[id] - Staff user ID ${session.user.id} tried to delete`);
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = parseInt(id);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Safety check: Cannot delete your own account
    if (targetUserId === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de usuario' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser || targetUser.restaurantId !== session.user.restaurantId) {
      console.warn(`DELETE /api/admin/users/[id] - User ID ${targetUserId} not found or not in restaurant ${session.user.restaurantId}`);
      return NextResponse.json({ error: 'Usuario no encontrado o no pertenece a tu local' }, { status: 404 });
    }

    console.log(`DELETE /api/admin/users/[id] - Deleting user ID ${targetUserId} by Admin ID ${session.user.id}`);

    await prisma.user.delete({
      where: { id: targetUserId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
