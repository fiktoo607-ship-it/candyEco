import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleServerError } from '@/lib/api-error-handler';

export { POST } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ratings = await prisma.rating.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(ratings);
  } catch (error) {
    return handleServerError(error, '[Product Reviews API GET]', 'Failed to fetch reviews');
  }
}
