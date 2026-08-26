import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createDeliveryMethodSchema = z.object({
  name: z.string().min(1, 'Le nom de la méthode de livraison est requis').trim(),
  description: z.string().optional().nullable(),
  price: z.union([
    z.number().nonnegative('Le prix doit être supérieur ou égal à 0'),
    z.string().regex(/^\d+(\.\d+)?$/, 'Le prix doit être un nombre positif').transform(Number)
  ]).default(0.0),
  homePrice: z.union([
    z.number().nonnegative('Le prix à domicile doit être supérieur ou égal à 0'),
    z.string().regex(/^\d+(\.\d+)?$/, 'Le prix à domicile doit être un nombre positif').transform(Number)
  ]).optional(),
  stockPrice: z.union([
    z.number().nonnegative('Le prix en point relais doit être supérieur ou égal à 0'),
    z.string().regex(/^\d+(\.\d+)?$/, 'Le prix en point relais doit être un nombre positif').transform(Number)
  ]).optional(),
  active: z.boolean().default(true).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const methods = await prisma.deliveryMethod.findMany({
      where: isAdmin ? {} : { active: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(methods);
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createDeliveryMethodSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, price, homePrice, stockPrice, active } = validationResult.data;

    const existing = await prisma.deliveryMethod.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json({ error: 'Cette méthode de livraison existe déjà' }, { status: 400 });
    }

    const parsedHomePrice = homePrice !== undefined ? homePrice : price;
    const parsedStockPrice = stockPrice !== undefined ? stockPrice : price;

    const newMethod = await prisma.deliveryMethod.create({
      data: {
        name,
        description: description || null,
        price,
        homePrice: parsedHomePrice,
        stockPrice: parsedStockPrice,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(newMethod, { status: 201 });
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}

