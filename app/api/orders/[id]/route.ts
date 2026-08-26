import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidStatusTransition, isValidOrderStatus, OrderStatus } from '@/types/orderStatusConfig';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const trimmedStatus = status.trim().toUpperCase();
    if (!isValidOrderStatus(trimmedStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    const targetStatus = trimmedStatus as OrderStatus;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'admin';
    const isOwner = existingOrder.userId === session.user.id;
    const currentStatus = existingOrder.status.toUpperCase();

    // Customer rules: Can cancel own order only while status is Pending.
    if (!isAdmin) {
      if (!isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
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

    // Validate general status transitions
    if (!isValidStatusTransition(currentStatus, targetStatus)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: targetStatus },
      select: {
        id: true,
        reference: true,
        sessionId: true,
        status: true,
        totalPrice: true,
        totalAmount: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        shippingAddress: true,
        deliveryMethod: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            quantity: true,
            priceAtPurchase: true,
            amountAtPurchase: true,
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('[Orders Detail API] Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
        sessionId: true,
        status: true,
        totalPrice: true,
        totalAmount: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        shippingAddress: true,
        deliveryMethod: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            quantity: true,
            priceAtPurchase: true,
            amountAtPurchase: true,
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'admin';
    const isOwner = order.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[Orders Detail API] Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

