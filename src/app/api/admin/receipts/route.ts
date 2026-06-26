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
    const receipts = await prisma.receipt.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: {
        restaurant: {
          select: {
            name: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching admin receipts:', error);
    return NextResponse.json({ error: 'Error al obtener recibos' }, { status: 500 });
  }
}
