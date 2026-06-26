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

    const modifiers = await prisma.modifierOption.findMany({
      where: { restaurantId: session.user.restaurantId },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(modifiers);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener modificadores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { name, price, type, description } = data;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const modifier = await prisma.modifierOption.create({
      data: { 
        name: name.trim(),
        description: description ? description.trim() : null,
        price: price ? parseFloat(price) : 0,
        type: type || 'FREE',
        restaurantId: session.user.restaurantId
      }
    });

    return NextResponse.json(modifier, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear modificador' }, { status: 500 });
  }
}
