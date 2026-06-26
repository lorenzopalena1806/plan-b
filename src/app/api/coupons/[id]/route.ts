import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'STAFF') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const couponId = parseInt(id);
    const body = await request.json();

    const existing = await prisma.coupon.findUnique({
      where: { id: couponId }
    });

    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
        discountValue: typeof body.discountValue === 'number' ? body.discountValue : existing.discountValue,
        minPurchase: typeof body.minPurchase === 'number' ? body.minPurchase : existing.minPurchase
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session.user.role === 'STAFF') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const couponId = parseInt(id);

    const existing = await prisma.coupon.findUnique({
      where: { id: couponId }
    });

    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id: couponId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Error al eliminar cupón' }, { status: 500 });
  }
}
