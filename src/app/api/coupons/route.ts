import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Error al obtener cupones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'STAFF') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { code, discountType, discountValue, minPurchase } = await request.json();
    const formattedCode = code.toUpperCase().trim();

    if (!formattedCode || !discountType || isNaN(parseFloat(discountValue))) {
      return NextResponse.json({ error: 'Faltan campos requeridos o son inválidos' }, { status: 400 });
    }

    // Check if code already exists for this restaurant
    const existing = await prisma.coupon.findUnique({
      where: {
        restaurantId_code: {
          restaurantId: session.user.restaurantId,
          code: formattedCode
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un cupón con este código' }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: formattedCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchase: parseFloat(minPurchase) || 0,
        isActive: true,
        restaurantId: session.user.restaurantId
      }
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Error al crear el cupón' }, { status: 500 });
  }
}
