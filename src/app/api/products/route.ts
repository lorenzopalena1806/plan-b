import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    const { name, description, price, imageUrl, categoryId, isPromo, modifierIds } = data;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: categoryId ? parseInt(categoryId) : null,
        isPromo: Boolean(isPromo),
        restaurantId: session.user.restaurantId,
        modifiers: modifierIds && modifierIds.length > 0 ? {
          connect: modifierIds.map((id: number) => ({ id }))
        } : undefined
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
