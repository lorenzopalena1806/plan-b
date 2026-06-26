import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    include: { configs: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(restaurants);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, slug } = data;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const newRestaurant = await prisma.restaurant.create({
      data: { 
        name, 
        slug,
        configs: {
          create: {
            whatsappNumber: '',
            openTime: '19:00',
            closeTime: '23:59',
            isOpenOverride: true,
            isSuspended: false
          }
        }
      },
    });

    return NextResponse.json(newRestaurant, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 });
  }
}
