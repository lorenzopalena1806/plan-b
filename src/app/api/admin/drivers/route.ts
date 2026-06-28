import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const drivers = await prisma.driver.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: { user: { select: { username: true } } },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(drivers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching drivers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { name, phone, isActive, username, password } = await request.json();

    let userId = null;

    if (username && password) {
      // Check if username already exists
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          rawPassword: password, // Store raw password so admin can view it (per previous structure)
          role: 'DRIVER',
          restaurantId: session.user.restaurantId
        }
      });
      userId = newUser.id;
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        isActive: isActive !== undefined ? isActive : true,
        restaurantId: session.user.restaurantId,
        userId
      },
      include: { user: { select: { username: true } } }
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating driver' }, { status: 500 });
  }
}
