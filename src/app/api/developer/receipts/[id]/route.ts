import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const receiptId = parseInt(id);

    const existing = await prisma.receipt.findUnique({
      where: { id: receiptId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Recibo no encontrado' }, { status: 404 });
    }

    await prisma.receipt.delete({
      where: { id: receiptId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json({ error: 'Error al eliminar el recibo' }, { status: 500 });
  }
}
