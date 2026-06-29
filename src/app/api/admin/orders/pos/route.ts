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

    const data = await request.json();
    
    // Create the order directly as PENDING (en cocina)
    const order = await prisma.order.create({
      data: {
        customerName: data.customerName || 'Cliente Mostrador',
        customerPhone: data.customerPhone || null,
        deliveryMethod: data.deliveryMethod || 'TAKEAWAY',
        address: data.address || null,
        status: data.status || 'PENDING',
        total: data.total,
        customerNotes: data.customerNotes || null,
        paymentMethod: data.paymentMethod || 'CASH',
        paymentDetails: data.paymentDetails || null,
        restaurantId: session.user.restaurantId,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            priceAtPurchase: item.basePrice,
            notes: item.modifiers && item.modifiers.length > 0 ? JSON.stringify(item.modifiers) : null
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('POS order error:', error);
    return NextResponse.json({ error: 'Error al procesar el pedido de caja' }, { status: 500 });
  }
}
