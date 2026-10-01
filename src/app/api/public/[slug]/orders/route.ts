import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductStockAndCalculateCost } from '@/lib/stockService';
import { headers } from 'next/headers';

// Simple in-memory rate limiting (per lambda instance)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    
    // Rate limit: max 5 orders per 10 minutes per IP
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxRequests = 5;

    const userRateData = rateLimitMap.get(ip);
    if (userRateData) {
      if (now > userRateData.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      } else {
        if (userRateData.count >= maxRequests) {
          return NextResponse.json({ error: 'Demasiados pedidos. Intenta nuevamente en unos minutos.' }, { status: 429 });
        }
        userRateData.count++;
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    }

    const { slug } = await params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const data = await request.json();
    const { 
      customerName, 
      customerPhone,
      deliveryMethod, 
      address, 
      items, 
      total, 
      customerNotes, 
      paymentMethod, 
      paymentDetails,
      couponCode,
      discountApplied,
      tipAmount
    } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El pedido debe tener al menos un producto' }, { status: 400 });
    }

    if (total === undefined || isNaN(parseFloat(total)) || parseFloat(total) < 0) {
      return NextResponse.json({ error: 'El total del pedido es inválido' }, { status: 400 });
    }

    if (!customerName || customerName.trim() === '') {
      return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 });
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await prisma.order.count({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: startOfDay }
      }
    });
    const dailyNumber = todayCount + 1;

    const openShift = await prisma.cashShift.findFirst({
      where: {
        restaurantId: restaurant.id,
        status: 'OPEN'
      }
    });

    const newOrder = await prisma.order.create({
      data: {
        dailyNumber,
        customerName,
        customerPhone,
        deliveryMethod,
        address,
        total: parseFloat(total),
        customerNotes,
        paymentMethod,
        paymentDetails,
        couponCode: couponCode || null,
        discountApplied: discountApplied ? parseFloat(discountApplied) : 0,
        tipAmount: tipAmount ? parseFloat(tipAmount) : 0,
        restaurantId: restaurant.id,
        shiftId: openShift ? openShift.id : null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            priceAtPurchase: item.basePrice,
            notes: (item.modifiers && item.modifiers.length > 0) 
              ? JSON.stringify(item.modifiers.map((m: any) => ({ name: m.name, price: m.price })))
              : (item.notes || null)
          })),
        },
      },
    });

    // Deduct stock for recipes (O(1) bulk processing to avoid N+1 queries)
    const totalCost = await deductStockAndCalculateCost(items);

    await prisma.order.update({
      where: { id: newOrder.id },
      data: { cost: totalCost }
    });

    if (customerPhone && customerPhone.trim().length >= 8) {
      await prisma.customer.upsert({
        where: {
          restaurantId_phone: {
            restaurantId: restaurant.id,
            phone: customerPhone.trim(),
          }
        },
        update: {
          name: customerName.trim(),
          address: address ? address.trim() : undefined,
        },
        create: {
          restaurantId: restaurant.id,
          phone: customerPhone.trim(),
          name: customerName.trim() || 'Cliente Frecuente',
          address: address ? address.trim() : null,
        }
      });
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}
