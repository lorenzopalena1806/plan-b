import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Fetch all COMPLETED orders to construct stats
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        restaurantId: session.user.restaurantId
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // We can aggregate stats on the server for speed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalEarnings = 0;
    let todayEarnings = 0;
    let totalOrdersCount = orders.length;
    let todayOrdersCount = 0;

    // Map to track product quantities sold
    const productSalesMap: Record<string, { quantity: number; revenue: number }> = {};

    orders.forEach(order => {
      totalEarnings += order.total;

      const orderDate = new Date(order.createdAt);
      const isToday = orderDate >= today;

      if (isToday) {
        todayEarnings += order.total;
        todayOrdersCount++;
      }

      order.items.forEach(item => {
        const key = item.productName;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { quantity: 0, revenue: 0 };
        }
        productSalesMap[key].quantity += item.quantity;
        productSalesMap[key].revenue += item.priceAtPurchase * item.quantity;
      });
    });

    const productSalesList = Object.entries(productSalesMap).map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue
    })).sort((a, b) => b.quantity - a.quantity);

    return NextResponse.json({
      orders,
      stats: {
        totalEarnings,
        todayEarnings,
        totalOrdersCount,
        todayOrdersCount
      },
      productSales: productSalesList
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({ error: 'Error al obtener datos de ventas' }, { status: 500 });
  }
}
