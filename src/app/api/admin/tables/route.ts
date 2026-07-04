import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'REJECTED'] }
          },
          include: { items: true }
        }
      }
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { number } = await request.json();

    const existing = await prisma.table.findFirst({
      where: {
        restaurantId: session.user.restaurantId,
        number: parseInt(number)
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'La mesa ya existe' }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        restaurantId: session.user.restaurantId,
      }
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
