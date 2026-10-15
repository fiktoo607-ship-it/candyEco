import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isValidStatusTransition, isValidOrderStatus, OrderStatus } from '@/types/orderStatusConfig';

function getClaimToken(request: NextRequest, orderId: string): string | null {
  const queryToken =
    request.nextUrl.searchParams.get('token') ||
    request.nextUrl.searchParams.get('claimToken') ||
    request.nextUrl.searchParams.get('guestClaimToken') ||
    request.nextUrl.searchParams.get('guestToken');
  if (queryToken && queryToken.trim()) return queryToken.trim();

  const headerToken =
    request.headers.get('x-guest-token') ||
    request.headers.get('x-claim-token') ||
    request.headers.get('x-guest-claim-token');
  if (headerToken && headerToken.trim()) return headerToken.trim();

  const cookieToken =
    request.cookies.get(`guest_order_${orderId}`)?.value ||
    request.cookies.get('guest_claim_token')?.value;
  if (cookieToken && cookieToken.trim()) return cookieToken.trim();

  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const claimToken = getClaimToken(request, id);

    if ((!session || !session.user) && !claimToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const isAdmin = session?.user?.role === 'admin';
    const isOwner = !!(session?.user?.id && existingOrder.userId && existingOrder.userId === session.user.id);
    const isAuthorizedGuest =
      !existingOrder.userId &&
      !!claimToken &&
      (
        existingOrder.sessionId === claimToken ||
        (existingOrder.sessionId && existingOrder.sessionId.toLowerCase() === claimToken.toLowerCase()) ||
        (existingOrder.customerPhone && existingOrder.customerPhone === claimToken) ||
        (existingOrder.customerEmail && existingOrder.customerEmail.toLowerCase() === claimToken.toLowerCase())
      );

    const currentStatus = existingOrder.status.toUpperCase();

    // Customer / Guest rules: Can cancel own order only while status is Pending.
    if (!isAdmin) {
      if (!isOwner && !isAuthorizedGuest) {
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

    // Optional client expected status check
    const clientExpectedStatus = body.expectedStatus || body.currentStatus;
    if (clientExpectedStatus && String(clientExpectedStatus).trim().toUpperCase() !== currentStatus) {
      return NextResponse.json(
        { error: 'Conflit : le statut actuel de la commande ne correspond pas au statut attendu.' },
        { status: 409 }
      );
    }

    // Optimistic locking / conditional status update to solve TOCTOU race conditions (Issue #59)
    const updateResult = await prisma.order.updateMany({
      where: {
        id,
        status: existingOrder.status,
      },
      data: { status: targetStatus },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'Conflit de concurrence : le statut de la commande a été modifié par une autre opération.' },
        { status: 409 }
      );
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
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const claimToken = getClaimToken(request, id);

    if ((!session || !session.user) && !claimToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const isAdmin = session?.user?.role === 'admin';
    const isOwner = !!(session?.user?.id && order.userId && order.userId === session.user.id);
    const isAuthorizedGuest =
      !order.userId &&
      !!claimToken &&
      (
        order.sessionId === claimToken ||
        (order.sessionId && order.sessionId.toLowerCase() === claimToken.toLowerCase()) ||
        (order.customerPhone && order.customerPhone === claimToken) ||
        (order.customerEmail && order.customerEmail.toLowerCase() === claimToken.toLowerCase())
      );

    if (!isAdmin && !isOwner && !isAuthorizedGuest) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[Orders Detail API] Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

