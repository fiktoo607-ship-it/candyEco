import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const targetStatus = status.toUpperCase();
    const currentStatus = existingOrder.status.toUpperCase();

    // Customer rules: Can cancel order while status is Pending.
    if (!isAdmin) {
      if (targetStatus !== 'CANCELLED') {
        return NextResponse.json({ error: 'Unauthorized to update order status' }, { status: 403 });
      }
      if (currentStatus !== 'PENDING') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
      }
    }

    // Restrictions: Cannot cancel Accepted or Delivered orders
    if (targetStatus === 'CANCELLED' && (currentStatus === 'ACCEPTED' || currentStatus === 'DELIVERED')) {
      return NextResponse.json({ error: 'Cannot cancel an accepted or delivered order' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to update order';
    console.error('[Orders Detail API] Error updating order:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch order';
    console.error('[Orders Detail API] Error fetching order:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
