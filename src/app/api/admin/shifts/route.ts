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

    const shift = await prisma.cashShift.findFirst({
      where: {
        restaurantId: session.user.restaurantId,
        status: 'OPEN'
      },
      include: {
        expenses: true,
        orders: true,
      }
    });

    if (!shift) {
      return NextResponse.json({ open: false });
    }

    return NextResponse.json({ open: true, shift });
  } catch (error) {
    console.error('Error fetching shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { action, initialBalance } = await request.json();

    if (action === 'OPEN') {
      const existingOpen = await prisma.cashShift.findFirst({
        where: { restaurantId: session.user.restaurantId, status: 'OPEN' }
      });
      
      if (existingOpen) {
        return NextResponse.json({ error: 'Ya existe un turno abierto' }, { status: 400 });
      }

      const shift = await prisma.cashShift.create({
        data: {
          restaurantId: session.user.restaurantId,
          initialBalance: parseFloat(initialBalance) || 0,
          expectedBalance: parseFloat(initialBalance) || 0,
        }
      });
      return NextResponse.json(shift, { status: 201 });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error with shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
