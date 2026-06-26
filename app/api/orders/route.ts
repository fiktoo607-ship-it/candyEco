import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RequestItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, customerEmail, shippingAddress, items, sessionId, deliveryMethod } = body;

    if (!customerName || !customerPhone || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required guest customer or cart information' }, { status: 400 });
    }

    const phoneRegex = /^\+?[0-9\s\-()]{6,25}$/;
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // 1. Fetch products from database to ensure pricing integrity
    const typedItems = items as RequestItem[];
    const productIds = typedItems.map((item) => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products in your cart could not be found' }, { status: 400 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Validate availability and calculate total amounts
    let totalAmount = 0;
    
    interface OrderItemData {
      productId: string;
      quantity: number;
      priceAtPurchase: string;
      amountAtPurchase: number;
    }
    
    const orderItemsData: OrderItemData[] = [];

    for (const item of typedItems) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }

      if (dbProduct.state === 'outofStock') {
        return NextResponse.json({ error: `Product "${dbProduct.title}" is out of stock` }, { status: 400 });
      }

      const numericPrice = parseFloat(dbProduct.price.replace(/[^0-9.]/g, ''));
      const itemAmount = (isNaN(numericPrice) ? 0 : numericPrice) * item.quantity;
      totalAmount += itemAmount;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: dbProduct.price,
        amountAtPurchase: isNaN(numericPrice) ? 0 : numericPrice,
      });
    }

    const totalPrice = `$${totalAmount.toFixed(2)}`;
    // 1 point per $1 spent
    const pointsEarned = Math.floor(totalAmount);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 3. Atomically write Order, OrderItems, and PointsTransaction
    const { newOrder, notification } = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sessionId,
          status: 'PENDING',
          totalPrice,
          totalAmount,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          shippingAddress,
          pointsEarned,
          userId,
          deliveryMethod,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (pointsEarned > 0) {
        await tx.pointsTransaction.create({
          data: {
            customerId: customerPhone,
            orderId: order.id,
            type: 'earn',
            points: pointsEarned,
            description: `Earned ${pointsEarned} loyalty points from order #${order.id.substring(0, 8).toUpperCase()}`,
          },
        });
      }

      const notif = await tx.orderNotification.create({
        data: {
          orderId: order.id,
        },
        include: {
          order: true,
        },
      });

      return { newOrder: order, notification: notif };
    });

    try {
      const { notificationEmitter } = await import('@/lib/notification-emitter');
      notificationEmitter.emit('new-order', notification);
    } catch (e) {
      console.error('[Orders API] Failed to emit new-order notification:', e);
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to submit order';
    console.error('[Orders API] Error creating order:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build filters dynamically
    interface QueryCondition {
      status?: string;
      OR?: Array<{
        customerName?: { contains: string; mode: 'insensitive' };
        customerPhone?: { contains: string; mode: 'insensitive' };
        customerEmail?: { contains: string; mode: 'insensitive' };
        shippingAddress?: { contains: string; mode: 'insensitive' };
        id?: { contains: string; mode: 'insensitive' };
      }>;
    }

    const where: QueryCondition = {};

    if (status) {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
        { customerEmail: { contains: query, mode: 'insensitive' } },
        { shippingAddress: { contains: query, mode: 'insensitive' } },
        { id: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Fetch completed order counts grouped by customerPhone
    const completedOrdersByPhone = await prisma.order.groupBy({
      by: ['customerPhone'],
      where: {
        status: { in: ['DELIVERED', 'COMPLETED'] },
        customerPhone: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Also fetch completed order counts grouped by userId
    const completedOrdersByUser = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: { in: ['DELIVERED', 'COMPLETED'] },
        userId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const phoneCountMap = new Map(completedOrdersByPhone.map(g => [g.customerPhone!, g._count.id]));
    const userCountMap = new Map(completedOrdersByUser.map(g => [g.userId!, g._count.id]));

    if (sortBy === 'trustScore') {
      const allMatchingOrders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      const mapped = allMatchingOrders.map((order) => {
        const trustScore = order.userId
          ? (userCountMap.get(order.userId) || 0)
          : (order.customerPhone ? (phoneCountMap.get(order.customerPhone) || 0) : 0);
        return {
          ...order,
          customerTrustScore: trustScore,
        };
      });

      mapped.sort((a, b) => {
        const diff = a.customerTrustScore - b.customerTrustScore;
        return sortOrder === 'desc' ? -diff : diff;
      });

      const paginated = mapped.slice(skip, skip + limit);

      return NextResponse.json({
        data: paginated,
        meta: {
          total: allMatchingOrders.length,
          page,
          limit,
          totalPages: Math.ceil(allMatchingOrders.length / limit) || 1,
        },
      });
    }

    // Fetch in parallel
    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: sortOrder as 'asc' | 'desc',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
    ]);

    const mapped = orders.map((order) => {
      const trustScore = order.userId
        ? (userCountMap.get(order.userId) || 0)
        : (order.customerPhone ? (phoneCountMap.get(order.customerPhone) || 0) : 0);
      return {
        ...order,
        customerTrustScore: trustScore,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
