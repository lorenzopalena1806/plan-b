import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { name, price, type, description } = data;

    const modifier = await prisma.modifierOption.findUnique({
      where: { id: parseInt(id) }
    });

    if (!modifier || modifier.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 });
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const updated = await prisma.modifierOption.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        type: type !== undefined ? type : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar modificador' }, { status: 500 });
  }
}

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
