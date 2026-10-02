import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache at the CDN edge for 60s — reduces DB hits dramatically for busy restaurants
export const revalidate = 60;

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

    const [config, categories, products, banners] = await Promise.all([
      prisma.config.findFirst({ where: { restaurantId: restaurant.id } }),
      prisma.category.findMany({ 
        where: { restaurantId: restaurant.id },
        orderBy: [{ order: 'asc' }, { name: 'asc' }]
      }),
      prisma.product.findMany({
        where: { 
          restaurantId: restaurant.id,
          isActive: true
        },
        include: { modifiers: true },
        orderBy: { id: 'desc' }
      }),
      prisma.banner.findMany({
        where: { restaurantId: restaurant.id, isActive: true },
        orderBy: { orderIndex: 'asc' }
      })
    ]);

    const response = NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      config,
      categories,
      products,
      banners
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error loading catalog' }, { status: 500 });
  }
}
