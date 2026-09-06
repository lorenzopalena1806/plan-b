import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: {
      category: true,
      modifiers: true,
      recipes: { include: { ingredient: true } },
      comboItems: { include: { product: true } }
    },
    orderBy: { id: 'desc' },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, description, price, imageUrl, images, categoryId, isPromo, isCombo, isActive, allowBulkQuantities, modifierIds, recipeItems, comboItems, station } = data;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        images: images || [],
        categoryId: categoryId ? parseInt(categoryId) : null,
        isPromo: Boolean(isPromo),
        isCombo: Boolean(isCombo),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        allowBulkQuantities: Boolean(allowBulkQuantities),
        restaurantId: session.user.restaurantId,
        modifiers: modifierIds && modifierIds.length > 0 ? {
          connect: modifierIds.map((id: number) => ({ id }))
        } : undefined,
        station: station || "GENERAL",
        recipes: (recipeItems && recipeItems.length > 0 && !isCombo) ? {
          create: recipeItems.map((r: any) => ({
            ingredientId: parseInt(r.ingredientId),
            quantityUsed: parseFloat(r.quantityUsed)
          }))
        } : undefined,
        comboItems: (comboItems && comboItems.length > 0 && isCombo) ? {
          create: comboItems.map((c: any) => ({
            productId: parseInt(c.productId),
            quantity: parseInt(c.quantity)
          }))
        } : undefined
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
