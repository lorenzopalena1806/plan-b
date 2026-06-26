import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const receipts = await prisma.receipt.findMany({
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Error al obtener recibos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { receiptNumber, amount, periodStart, periodEnd, description, restaurantId } = body;

    if (!receiptNumber || isNaN(parseFloat(amount)) || !periodStart || !periodEnd || !restaurantId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios o son inválidos' }, { status: 400 });
    }

    // Check if receiptNumber is unique
    const existing = await prisma.receipt.findUnique({
      where: { receiptNumber }
    });

    if (existing) {
      return NextResponse.json({ error: 'El número de recibo ya existe' }, { status: 400 });
    }

    const newReceipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        amount: parseFloat(amount),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        description: description || null,
        restaurantId: parseInt(restaurantId)
      },
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: 'Error al crear el recibo' }, { status: 500 });
  }
}
