import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; code: string }> }
) {
  try {
    const { slug, code } = await params;
    const formattedCode = code.toUpperCase().trim();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        restaurantId_code: {
          restaurantId: restaurant.id,
          code: formattedCode
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupón inválido o inexistente' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'El cupón no está activo' }, { status: 400 });
    }

    return NextResponse.json({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Error al validar el cupón' }, { status: 500 });
  }
}
