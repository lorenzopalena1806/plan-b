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
    const { name, description, price, imageUrl, images, categoryId, isPromo, isCombo, isActive, allowBulkQuantities, modifierIds, recipeItems, comboItems, station } = data;

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
        images: images !== undefined ? images : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? (isNaN(parseInt(categoryId)) ? null : parseInt(categoryId)) : null) : undefined,
        isPromo: isPromo !== undefined ? Boolean(isPromo) : undefined,
        isCombo: isCombo !== undefined ? Boolean(isCombo) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        allowBulkQuantities: allowBulkQuantities !== undefined ? Boolean(allowBulkQuantities) : undefined,
        modifiers: modifierIds !== undefined ? {
          set: [],
          connect: modifierIds?.map((mId: number) => ({ id: mId })) || []
        } : undefined,
        station: station !== undefined ? station : undefined,
      },
    });

    if (recipeItems !== undefined || isCombo !== undefined) {
      // Clear existing recipes
      await prisma.recipeItem.deleteMany({
        where: { productId: parseInt(id) }
      });
      // Insert new ones if it's not a combo
      if (recipeItems && recipeItems.length > 0 && !isCombo) {
        await prisma.recipeItem.createMany({
          data: recipeItems.map((r: any) => ({
            productId: parseInt(id),
            ingredientId: parseInt(r.ingredientId),
            quantityUsed: parseFloat(r.quantityUsed)
          }))
        });
      }
    }
    
    if (comboItems !== undefined || isCombo !== undefined) {
      // Clear existing combo items
      await prisma.comboItem.deleteMany({
        where: { comboId: parseInt(id) }
      });
      // Insert new ones if it is a combo
      if (comboItems && comboItems.length > 0 && isCombo) {
        await prisma.comboItem.createMany({
          data: comboItems.map((c: any) => ({
            comboId: parseInt(id),
            productId: parseInt(c.productId),
            quantity: parseInt(c.quantity)
          }))
        });
      }
    }


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
