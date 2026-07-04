import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { amount, description } = await request.json();

    const openShift = await prisma.cashShift.findFirst({
      where: {
        restaurantId: session.user.restaurantId,
        status: 'OPEN'
      }
    });

    if (!openShift) {
      return NextResponse.json({ error: 'No hay turno abierto' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description: description.trim(),
        shiftId: openShift.id,
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
