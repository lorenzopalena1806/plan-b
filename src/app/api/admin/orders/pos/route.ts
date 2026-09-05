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

    // Deduct stock for recipes
    try {
      for (const item of data.items) {
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
            const modifierRecipes = await prisma.modifierRecipeItem.findMany({
              where: { modifierId: mod.id }
            });
            
            for (const recipe of modifierRecipes) {
              const totalUsed = recipe.quantityUsed * item.quantity;
              await prisma.ingredient.update({
                where: { id: recipe.ingredientId },
                data: { currentStock: { decrement: totalUsed } }
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error deducting stock:', e);
      // We don't fail the order if stock deduction fails, but we log it.
    }

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
