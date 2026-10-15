import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleServerError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ canRate: false, reason: 'unauthenticated' });
    }

    const user = session.user as any;

    // 1. Enforce uniqueness: allow only one rating per user per product (Issue #11)
    if (typeof prisma.rating?.findFirst === 'function') {
      const existingRating = await prisma.rating.findFirst({
        where: {
          productId: id,
          userId: user.id,
        },
      });

      if (existingRating) {
        return NextResponse.json({ canRate: false, reason: 'already_rated' });
      }
    }

    // 2. Strict user ownership verification (Issue #19)
    // Rating eligibility is strictly bound to delivered orders owned by the authenticated userId
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: ['DELIVERED', 'COMPLETED'] },
        items: {
          some: {
            productId: id
          }
        }
      }
    });

    return NextResponse.json({ canRate: !!deliveredOrder });
  } catch (error) {
    return handleServerError(error, '[CanRate API]', 'Une erreur interne est survenue.');
  }
}
