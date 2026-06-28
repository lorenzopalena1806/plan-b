import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const { name, description, price, imageUrl, categoryId, isPromo, isActive, allowBulkQuantities, modifierIds } = data;

    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existingProduct || existingProduct.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? (isNaN(parseInt(categoryId)) ? null : parseInt(categoryId)) : null) : undefined,
        isPromo: isPromo !== undefined ? Boolean(isPromo) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        allowBulkQuantities: allowBulkQuantities !== undefined ? Boolean(allowBulkQuantities) : undefined,
        modifiers: modifierIds !== undefined ? {
          set: [],
          connect: modifierIds?.map((mId: number) => ({ id: mId })) || []
        } : undefined
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existingProduct || existingProduct.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
