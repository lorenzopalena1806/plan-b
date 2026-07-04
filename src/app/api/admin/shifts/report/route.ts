import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { shiftId, email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email destino es requerido' }, { status: 400 });
    }

    const shift = await prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { orders: true, expenses: true, restaurant: true }
    });

    if (!shift || shift.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }

    let cashSales = 0;
    let transferSales = 0;
    shift.orders.forEach(o => {
      if (o.paymentMethod === 'CASH') cashSales += o.total;
      else if (o.paymentMethod === 'TRANSFER') transferSales += o.total;
    });

    const expensesTotal = shift.expenses.reduce((s, e) => s + e.amount, 0);
    const expectedBalance = shift.initialBalance + cashSales - expensesTotal;

    const htmlContent = `
      <h1>Reporte de Turno - ${shift.restaurant.name}</h1>
      <p><strong>Apertura:</strong> ${shift.openedAt.toLocaleString('es-AR')}</p>
      <p><strong>Cierre:</strong> ${shift.closedAt ? shift.closedAt.toLocaleString('es-AR') : 'Aún abierto'}</p>
      <hr/>
      <h3>Resumen Financiero</h3>
      <ul>
        <li><strong>Saldo Inicial:</strong> $${shift.initialBalance}</li>
        <li><strong>Ventas en Efectivo:</strong> +$${cashSales}</li>
        <li><strong>Ventas por Transferencia:</strong> +$${transferSales}</li>
        <li><strong>Egresos (Caja Chica):</strong> -$${expensesTotal}</li>
      </ul>
      <p><strong>Total Esperado en Caja (Efectivo):</strong> $${expectedBalance}</p>
      ${shift.actualBalance !== null ? `<p><strong>Efectivo Real Contado:</strong> $${shift.actualBalance} (Diferencia: $${shift.difference})</p>` : ''}
      <hr/>
      <h3>Detalle de Egresos</h3>
      <ul>
        ${shift.expenses.length === 0 ? '<li>Sin egresos</li>' : shift.expenses.map(e => `<li>$${e.amount} - ${e.description}</li>`).join('')}
      </ul>
      <hr/>
      <p>PoloSandia v2.0</p>
    `;

    // Only send if API KEY is set
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Reportes <onboarding@resend.dev>',
        to: [email],
        subject: `Reporte de Turno #${shift.id} - ${shift.restaurant.name}`,
        html: htmlContent,
      });
      return NextResponse.json({ success: true, message: 'Email enviado correctamente' });
    } else {
      return NextResponse.json({ success: true, message: 'Simulación exitosa (No hay RESEND_API_KEY en .env)' });
    }

  } catch (error) {
    console.error('Error sending report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
