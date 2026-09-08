import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const shifts = await prisma.cashShift.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: {
        expenses: true,
        orders: {
          where: { status: 'COMPLETED' },
          select: { id: true, total: true, paymentMethod: true }
        }
      },
      orderBy: { openedAt: 'desc' },
      take: 60
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
