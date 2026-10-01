import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const restaurantId = session.user.restaurantId;

    const customer = await prisma.customer.findUnique({
      where: {
        restaurantId_phone: {
          restaurantId,
          phone
        }
      }
    });

    if (customer) {
      return NextResponse.json({ found: true, customer });
    } else {
      return NextResponse.json({ found: false });
    }

  } catch (error) {
    console.error('Error searching customer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
