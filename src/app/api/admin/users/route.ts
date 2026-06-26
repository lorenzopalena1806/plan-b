import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { restaurantId: session.user.restaurantId },
      select: {
        id: true,
        username: true,
        role: true
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.restaurantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role === 'STAFF') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const data = await request.json();
    const { username, password, role } = data;

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son obligatorios' }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: 'El usuario debe tener al menos 3 caracteres' }, { status: 400 });
    }

    // Check if username already exists globally
    const existing = await prisma.user.findUnique({
      where: { username: trimmedUsername }
    });

    if (existing) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
        restaurantId: session.user.restaurantId
      }
    });

    return NextResponse.json({ id: newUser.id, username: newUser.username }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
