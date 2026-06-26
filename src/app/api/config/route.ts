import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let config = await prisma.config.findFirst({
    where: { restaurantId: session.user.restaurantId }
  });

  if (!config) {
    config = await prisma.config.create({
      data: {
        whatsappNumber: '',
        openTime: '20:00',
        closeTime: '23:59',
        restaurantId: session.user.restaurantId
      }
    });
  }
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { 
    whatsappNumber, 
    openTime, 
    closeTime, 
    isOpenOverride, 
    logoUrl, 
    themeColor,
    bgColor,
    cardColor,
    textColor,
    fontFamily,
    cardLayout,
    bankAlias
  } = await request.json();

  const config = await prisma.config.findFirst({
    where: { restaurantId: session.user.restaurantId }
  });

  const configData = {
    whatsappNumber,
    openTime,
    closeTime,
    isOpenOverride,
    logoUrl,
    themeColor,
    bgColor,
    cardColor,
    textColor,
    fontFamily,
    cardLayout,
    bankAlias
  };

  if (config) {
    const updated = await prisma.config.update({
      where: { id: config.id },
      data: configData,
    });
    return NextResponse.json(updated);
  } else {
    const created = await prisma.config.create({
      data: { 
        ...configData, 
        restaurantId: session.user.restaurantId 
      },
    });
    return NextResponse.json(created);
  }
}
