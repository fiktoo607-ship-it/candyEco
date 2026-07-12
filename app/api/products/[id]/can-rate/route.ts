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
    const conditions: any[] = [{ userId: user.id }];
    if (user.phone) {
      conditions.push({ customerPhone: user.phone });
    }
    if (user.email) {
      conditions.push({ customerEmail: user.email });
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        OR: conditions,
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
