import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'Formato incorrecto' }, { status: 400 });
    }

    // Usar una transacción para actualizar todas las categorías en orden
    await prisma.$transaction(
      orderedIds.map((id: number, index: number) =>
        prisma.category.updateMany({
          where: { 
            id,
            restaurantId: session.user.restaurantId // Asegurar pertenencia
          },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
