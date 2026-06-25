import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, active } = body;

    const existing = await prisma.deliveryMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Méthode de livraison non trouvée' }, { status: 404 });
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.deliveryMethod.findUnique({
        where: { name },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Une autre méthode de livraison a déjà ce nom' }, { status: 400 });
      }
    }

    const updated = await prisma.deliveryMethod.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.deliveryMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Méthode de livraison non trouvée' }, { status: 404 });
    }

    await prisma.deliveryMethod.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
