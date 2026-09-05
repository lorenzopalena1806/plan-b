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
              ? JSON.stringify({ modifiers: item.modifiers || [] }) 
              : null
          })),
        },
      },
    });

    try {
      for (const item of items) {
        if (!item.productId) continue;
        
        const productRecipes = await prisma.recipeItem.findMany({
          where: { productId: item.productId }
        });
        
        for (const recipe of productRecipes) {
          const totalUsed = recipe.quantityUsed * item.quantity;
          await prisma.ingredient.update({
            where: { id: recipe.ingredientId },
            data: { currentStock: { decrement: totalUsed } }
          });
        }
        
        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            await prisma.modifierOption.updateMany({
              where: { id: mod.id, isUnlimited: false },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }
      }
    } catch (e) {
      console.error('Error deducting stock:', e);
    }

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
