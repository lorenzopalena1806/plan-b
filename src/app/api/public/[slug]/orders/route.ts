import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
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

    const newOrder = await prisma.order.create({
      data: {
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
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            priceAtPurchase: item.basePrice,
            notes: item.modifiers && item.modifiers.length > 0 ? JSON.stringify(item.modifiers) : null
          })),
        },
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}
