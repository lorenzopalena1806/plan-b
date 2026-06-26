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
    const restaurantId = session.user.restaurantId;
    let hours = await prisma.businessHour.findMany({
      where: { restaurantId },
      orderBy: { dayOfWeek: 'asc' }
    });

    // Auto-create defaults if they don't exist
    if (hours.length < 7) {
      const existingDays = new Set(hours.map(h => h.dayOfWeek));
      const defaults = [];

      for (let day = 0; day <= 6; day++) {
        if (!existingDays.has(day)) {
          defaults.push({
            dayOfWeek: day,
            isOpen: true,
            shift1Open: '12:00',
            shift1Close: '15:00',
            shift2Open: '20:00',
            shift2Close: '23:59',
            restaurantId
          });
        }
      }

      if (defaults.length > 0) {
        await prisma.businessHour.createMany({
          data: defaults
        });
        // Refetch
        hours = await prisma.businessHour.findMany({
          where: { restaurantId },
          orderBy: { dayOfWeek: 'asc' }
        });
      }
    }

    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching business hours:', error);
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
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
    const restaurantId = session.user.restaurantId;
    const hoursData = await request.json();

    if (!Array.isArray(hoursData)) {
      return NextResponse.json({ error: 'Formato de datos inválido' }, { status: 400 });
    }

    for (const h of hoursData) {
      await prisma.businessHour.upsert({
        where: {
          restaurantId_dayOfWeek: {
            restaurantId,
            dayOfWeek: h.dayOfWeek
          }
        },
        update: {
          isOpen: h.isOpen,
          shift1Open: h.shift1Open || null,
          shift1Close: h.shift1Close || null,
          shift2Open: h.shift2Open || null,
          shift2Close: h.shift2Close || null
        },
        create: {
          restaurantId,
          dayOfWeek: h.dayOfWeek,
          isOpen: h.isOpen,
          shift1Open: h.shift1Open || null,
          shift1Close: h.shift1Close || null,
          shift2Open: h.shift2Open || null,
          shift2Close: h.shift2Close || null
        }
      });
    }

    const updatedHours = await prisma.businessHour.findMany({
      where: { restaurantId },
      orderBy: { dayOfWeek: 'asc' }
    });

    return NextResponse.json(updatedHours);
  } catch (error) {
    console.error('Error updating business hours:', error);
    return NextResponse.json({ error: 'Error al actualizar horarios' }, { status: 500 });
  }
}
