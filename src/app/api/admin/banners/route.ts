import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const banners = await prisma.banner.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { orderIndex: 'asc' }
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching banners' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { imageUrl, link, isActive, orderIndex } = await request.json();
    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        link,
        isActive: isActive !== undefined ? isActive : true,
        orderIndex: orderIndex || 0,
        restaurantId: session.user.restaurantId
      }
    });
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating banner' }, { status: 500 });
  }
}
