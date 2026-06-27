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

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'DELIVERED',
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
