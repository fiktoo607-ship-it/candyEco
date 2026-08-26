import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateDeliveryMethodSchema = z.object({
  name: z.string().min(1, 'Le nom ne peut pas être vide').trim().optional(),
  description: z.string().optional().nullable(),
  price: z.union([
    z.number().nonnegative('Le prix doit être supérieur ou égal à 0'),
    z.string().regex(/^\d+(\.\d+)?$/, 'Le prix doit être un nombre positif').transform(Number)
  ]).optional(),
  homePrice: z.union([
    z.number().nonnegative('Le prix à domicile doit être supérieur ou égal à 0'),
    z.string().regex(/^\d+(\.\d+)?$/, 'Le prix à domicile doit être un nombre positif').transform(Number)
  ]).optional(),
  stockPrice: z.union([
    z.number().nonnegative('Le prix en point relais doit être supérieur ou égal à 0'),
    z.string().regex(/^\d+(\.\d+)?$/, 'Le prix en point relais doit être un nombre positif').transform(Number)
  ]).optional(),
  active: z.boolean().optional(),
});

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

    const validationResult = updateDeliveryMethodSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, price, homePrice, stockPrice, active } = validationResult.data;

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

    const updatedPrice = price !== undefined ? price : existing.price;

    const updated = await prisma.deliveryMethod.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        price: updatedPrice,
        homePrice: homePrice !== undefined ? homePrice : existing.homePrice ?? updatedPrice,
        stockPrice: stockPrice !== undefined ? stockPrice : existing.stockPrice ?? updatedPrice,
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
