import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { restaurantId } = await request.json();

    if (!restaurantId) {
      return NextResponse.json({ error: 'Falta restaurantId' }, { status: 400 });
    }

    const parsedId = parseInt(restaurantId);

    // Verify that the user has permission to manage this restaurant
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { managedRestaurants: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const canManage = user.managedRestaurants.some(r => r.id === parsedId);
    
    // Si es superadmin o si el restaurante está en su lista de permitidos
    if (user.role !== 'SUPERADMIN' && !canManage) {
      return NextResponse.json({ error: 'No tienes permisos para esta sucursal' }, { status: 403 });
    }

    // Update active restaurant in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { restaurantId: parsedId }
    });

    return NextResponse.json({ success: true, restaurantId: parsedId });
  } catch (error) {
    console.error('Error changing active restaurant:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
