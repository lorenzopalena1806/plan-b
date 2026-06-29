import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Verificar propiedad
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category || category.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 });
    }

    // Actualizar nombre y descuentos
    await prisma.$transaction(async (tx) => {
      if (body.name) {
        await tx.category.update({
          where: { id: parseInt(id) },
          data: { name: body.name }
        });
      }

      if (body.discounts !== undefined) {
        // Borrar actuales
        await tx.categoryDiscount.deleteMany({
          where: { categoryId: parseInt(id) }
        });
        
        // Crear nuevos
        if (body.discounts.length > 0) {
          await tx.categoryDiscount.createMany({
            data: body.discounts.map((d: any) => ({
              categoryId: parseInt(id),
              quantity: parseInt(d.quantity),
              price: parseFloat(d.price)
            }))
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    // Verificar que la categoría pertenezca a su restaurante
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category || category.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado o no existe' }, { status: 403 });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
