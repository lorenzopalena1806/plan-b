import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const { name, price, type, description, isActive, ingredients } = data;

    const modifier = await prisma.modifierOption.findUnique({
      where: { id: parseInt(id) }
    });

    if (!modifier || modifier.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 });
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Delete existing recipes if we are updating ingredients
    if (ingredients) {
      await prisma.modifierRecipeItem.deleteMany({
        where: { modifierId: parseInt(id) }
      });
    }

    const updated = await prisma.modifierOption.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        type: type !== undefined ? type : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        recipes: ingredients && ingredients.length > 0 ? {
          create: ingredients.map((ing: any) => ({
            ingredientId: parseInt(ing.ingredientId),
            quantityUsed: parseFloat(ing.quantityUsed)
          }))
        } : undefined
      },
      include: {
        recipes: {
          include: { ingredient: true }
        }
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
