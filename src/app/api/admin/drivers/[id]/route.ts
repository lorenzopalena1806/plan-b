import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, phone, isActive, username, password } = await request.json();

    const driverId = parseInt(id);

    // Verify ownership
    const existing = await prisma.driver.findUnique({ 
      where: { id: driverId },
      include: { user: true }
    });
    
    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    let userId = existing.userId;

    if (username) {
      if (existing.user) {
        // Update existing user
        const updateData: any = { username };
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
          updateData.rawPassword = password;
        }
        await prisma.user.update({
          where: { id: existing.userId! },
          data: updateData
        });
      } else {
        // Create new user for existing driver
        if (!password) {
          return NextResponse.json({ error: 'Se requiere contraseña para crear un usuario' }, { status: 400 });
        }
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
          return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
          data: {
            username,
            password: hashedPassword,
            rawPassword: password,
            role: 'DRIVER',
            restaurantId: session.user.restaurantId
          }
        });
        userId = newUser.id;
      }
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: { name, phone, isActive, userId },
      include: { user: { select: { username: true } } }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating driver' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.restaurantId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const driverId = parseInt(id);

    // Verify ownership
    const existing = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    if (existing.userId) {
      await prisma.user.delete({ where: { id: existing.userId } });
    }
    
    await prisma.driver.delete({ where: { id: driverId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting driver' }, { status: 500 });
  }
}
