import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const { name, description, price, homePrice, stockPrice, active } = body;

    if (!name) {
      return NextResponse.json({ error: 'Le nom de la méthode de livraison est requis' }, { status: 400 });
    }

    const existing = await prisma.deliveryMethod.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json({ error: 'Cette méthode de livraison existe déjà' }, { status: 400 });
    }

    const parsedPrice = price !== undefined ? parseFloat(price) : 0.0;
    const parsedHomePrice = homePrice !== undefined ? parseFloat(homePrice) : parsedPrice;
    const parsedStockPrice = stockPrice !== undefined ? parseFloat(stockPrice) : parsedPrice;

    const newMethod = await prisma.deliveryMethod.create({
      data: {
        name,
        description,
        price: parsedPrice,
        homePrice: parsedHomePrice,
        stockPrice: parsedStockPrice,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json(newMethod, { status: 201 });
  } catch (error) {
    const err = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
