import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const [config, categories, products] = await Promise.all([
      prisma.config.findFirst({ where: { restaurantId: restaurant.id } }),
      prisma.category.findMany({ 
        where: { restaurantId: restaurant.id },
        orderBy: { name: 'asc' }
      }),
      prisma.product.findMany({
        where: { 
          restaurantId: restaurant.id,
          isActive: true
        },
        include: { modifiers: true },
        orderBy: { id: 'desc' }
      })
    ]);

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      config,
      categories,
      products
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error loading catalog' }, { status: 500 });
  }
}
