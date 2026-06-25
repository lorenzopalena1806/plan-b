import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    const modifier = await prisma.modifierOption.findUnique({
      where: { id: parseInt(id) }
    });

    if (!modifier || modifier.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 });
    }

    await prisma.modifierOption.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar modificador' }, { status: 500 });
  }
}
