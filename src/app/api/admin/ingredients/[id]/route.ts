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
    const ingredientId = parseInt(id);

    const data = await request.json();
    const { name, stockUnit, currentStock, unitCost } = data;

    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId, restaurantId: session.user.restaurantId },
      data: {
        name,
        stockUnit,
        currentStock: parseFloat(currentStock),
        unitCost: parseFloat(unitCost),
      }
    });

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const ingredientId = parseInt(id);

    await prisma.ingredient.delete({
      where: { id: ingredientId, restaurantId: session.user.restaurantId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
