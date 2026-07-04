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

    const { shiftId, actualBalance } = await request.json();

    const shift = await prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { orders: true, expenses: true }
    });

    if (!shift || shift.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }

    if (shift.status === 'CLOSED') {
      return NextResponse.json({ error: 'El turno ya está cerrado' }, { status: 400 });
    }

    // Calcular expected balance: initialBalance + ventas_efectivo - egresos
    let cashSales = 0;
    shift.orders.forEach(o => {
      if (o.paymentMethod === 'CASH') {
        cashSales += o.total;
      }
    });

    let expensesTotal = 0;
    shift.expenses.forEach(e => {
      expensesTotal += e.amount;
    });

    const expectedBalance = shift.initialBalance + cashSales - expensesTotal;
    const difference = actualBalance - expectedBalance;

    const closedShift = await prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        expectedBalance,
        actualBalance,
        difference
      }
    });

    return NextResponse.json(closedShift, { status: 200 });
  } catch (error) {
    console.error('Error closing shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
