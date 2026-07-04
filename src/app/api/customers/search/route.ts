import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const restIdCookie = cookieStore.get('restaurantId');
    const restaurantId = restIdCookie ? parseInt(restIdCookie.value) : 1;

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
