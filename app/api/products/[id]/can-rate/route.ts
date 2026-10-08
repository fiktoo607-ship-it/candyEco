import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // 2. Exact user/order ownership verification (Issue #10)
    // Replace loose phone/email OR matching with exact ownership check
    const ownershipConditions: any[] = [{ userId: user.id }];

    if (user.phone && user.email) {
      ownershipConditions.push({
        customerPhone: user.phone,
        customerEmail: user.email,
        OR: [{ userId: null }, { userId: user.id }],
      });
    } else if (user.phone) {
      ownershipConditions.push({
        customerPhone: user.phone,
        OR: [{ userId: null }, { userId: user.id }],
      });
    } else if (user.email) {
      ownershipConditions.push({
        customerEmail: user.email,
        OR: [{ userId: null }, { userId: user.id }],
      });
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        OR: ownershipConditions,
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
    const errMsg = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ canRate: false, error: errMsg }, { status: 500 });
  }
}
