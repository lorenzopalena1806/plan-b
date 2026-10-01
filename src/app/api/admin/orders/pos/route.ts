import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deductStockAndCalculateCost } from '@/lib/stockService';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe tener al menos un producto' }, { status: 400 });
    }

    if (data.total === undefined || isNaN(parseFloat(data.total)) || parseFloat(data.total) < 0) {
      return NextResponse.json({ error: 'El total del pedido es inválido' }, { status: 400 });
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await prisma.order.count({
      where: {
        restaurantId: session.user.restaurantId,
        createdAt: { gte: startOfDay }
      }
    });
    const dailyNumber = todayCount + 1;

    // Find open shift to link
    const openShift = await prisma.cashShift.findFirst({
      where: {
        restaurantId: session.user.restaurantId,
        status: 'OPEN'
      }
    });

    // Create the order directly as PENDING (en cocina)
    const order = await prisma.order.create({
      data: {
        dailyNumber,
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
        shiftId: openShift ? openShift.id : null,
        tableId: data.tableId ? parseInt(data.tableId) : null,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            priceAtPurchase: item.basePrice,
            notes: (item.modifiers && item.modifiers.length > 0) || (item.variants && item.variants.length > 0) 
              ? JSON.stringify({ modifiers: item.modifiers || [], variants: item.variants || [] }) 
              : null
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Deduct stock for recipes (O(1) bulk processing to avoid N+1 queries)
    const totalCost = await deductStockAndCalculateCost(data.items);

    await prisma.order.update({
      where: { id: order.id },
      data: { cost: totalCost }
    });

    // Save customer to CRM if phone is provided
    if (data.customerPhone && data.customerPhone.trim().length >= 8) {
      await prisma.customer.upsert({
        where: {
          restaurantId_phone: {
            restaurantId: session.user.restaurantId,
            phone: data.customerPhone.trim(),
          }
        },
        update: {
          name: data.customerName.trim(),
          address: data.address ? data.address.trim() : undefined,
        },
        create: {
          restaurantId: session.user.restaurantId,
          phone: data.customerPhone.trim(),
          name: data.customerName.trim() || 'Cliente Frecuente',
          address: data.address ? data.address.trim() : null,
        }
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('POS order error:', error);
    return NextResponse.json({ error: 'Error al procesar el pedido de caja' }, { status: 500 });
  }
}
