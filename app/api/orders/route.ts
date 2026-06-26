import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteConfig } from '@/lib/config';

interface RequestItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const storeEnabled = await getSiteConfig<boolean>('store_enabled');
    if (storeEnabled === false) {
      const storeMessage = await getSiteConfig<string>('store_message') || "Le magasin est temporairement fermé.";
      return NextResponse.json({ error: storeMessage }, { status: 400 });
    }

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
    let attempts = 0;
    const maxAttempts = 3;
    let transactionResult;

    while (attempts < maxAttempts) {
      try {
        transactionResult = await prisma.$transaction(async (tx) => {
          // Generate reference code ORD-YYYYMMDD-XXX
          const now = new Date();
          const yyyy = now.getUTCFullYear();
          const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(now.getUTCDate()).padStart(2, '0');
          const todayStr = `${yyyy}${mm}${dd}`;
          const prefix = `ORD-${todayStr}-`;

          const lastOrderForToday = await tx.order.findFirst({
            where: {
              reference: {
                startsWith: prefix
              }
            },
            orderBy: {
              reference: 'desc'
            },
            select: {
              reference: true
            }
          });

          let nextSeq = 1;
          if (lastOrderForToday?.reference) {
            const parts = lastOrderForToday.reference.split('-');
            const lastSeq = parseInt(parts[2] || '0', 10);
            nextSeq = lastSeq + 1;
          }
          const seqStr = String(nextSeq).padStart(3, '0');
          const reference = `${prefix}${seqStr}`;

          const order = await tx.order.create({
            data: {
              reference,
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
                description: `Earned ${pointsEarned} loyalty points from order #${reference}`,
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
        break; // Success!
      } catch (err: any) {
        attempts++;
        if (err.code === 'P2002' && attempts < maxAttempts) {
          console.warn(`Unique constraint violation on order reference. Retrying attempt ${attempts}...`);
          continue;
        }
        throw err;
      }
    }

    const { newOrder, notification } = transactionResult!;

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
        reference?: { contains: string; mode: 'insensitive' };
      }>;
    }

    const where: QueryCondition = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (query) {
      where.OR = [
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
        { customerEmail: { contains: query, mode: 'insensitive' } },
        { shippingAddress: { contains: query, mode: 'insensitive' } },
        { id: { contains: query, mode: 'insensitive' } },
        { reference: { contains: query, mode: 'insensitive' } },
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

    // Fetch total order counts grouped by customerPhone
    const totalOrdersByPhone = await prisma.order.groupBy({
      by: ['customerPhone'],
      where: {
        customerPhone: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Fetch total order counts grouped by userId
    const totalOrdersByUser = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const phoneCountMap = new Map(completedOrdersByPhone.map(g => [g.customerPhone!, g._count.id]));
    const userCountMap = new Map(completedOrdersByUser.map(g => [g.userId!, g._count.id]));
    const phoneTotalCountMap = new Map(totalOrdersByPhone.map(g => [g.customerPhone!, g._count.id]));
    const userTotalCountMap = new Map(totalOrdersByUser.map(g => [g.userId!, g._count.id]));

    const total = await prisma.order.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;

    // Check if we can sort natively in database or must sort in memory
    const isDatabaseSort = ['createdAt', 'status'].includes(sortBy);

    if (isDatabaseSort) {
      const orders = await prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      const mapped = orders.map((order) => {
        const trustScore = order.userId
          ? (userCountMap.get(order.userId) || 0)
          : (order.customerPhone ? (phoneCountMap.get(order.customerPhone) || 0) : 0);
        const orderCount = order.userId
          ? (userTotalCountMap.get(order.userId) || 0)
          : (order.customerPhone ? (phoneTotalCountMap.get(order.customerPhone) || 0) : 0);
        return {
          ...order,
          customerTrustScore: trustScore,
          customerOrderCount: orderCount,
        };
      });

      return NextResponse.json({
        data: mapped,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    } else {
      // Sorting by computed fields: 'trustScore' or 'orderCount'
      // 1. Fetch only metadata of matching orders (extremely lightweight)
      const ordersMetadata = await prisma.order.findMany({
        where,
        select: {
          id: true,
          userId: true,
          customerPhone: true,
        },
      });

      // 2. Map metadata to sorting values
      const mappedMeta = ordersMetadata.map((order) => {
        const trustScore = order.userId
          ? (userCountMap.get(order.userId) || 0)
          : (order.customerPhone ? (phoneCountMap.get(order.customerPhone) || 0) : 0);
        const orderCount = order.userId
          ? (userTotalCountMap.get(order.userId) || 0)
          : (order.customerPhone ? (phoneTotalCountMap.get(order.customerPhone) || 0) : 0);
        return {
          id: order.id,
          trustScore,
          orderCount,
        };
      });

      // 3. Sort mapped meta list in memory
      mappedMeta.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'trustScore') {
          valA = a.trustScore;
          valB = b.trustScore;
        } else if (sortBy === 'orderCount') {
          valA = a.orderCount;
          valB = b.orderCount;
        }

        const diff = valA - valB;
        return sortOrder === 'desc' ? -diff : diff;
      });

      // 4. Slice to get page's IDs
      const paginatedMeta = mappedMeta.slice(skip, skip + limit);
      const paginatedIds = paginatedMeta.map(o => o.id);

      // 5. Fetch fully populated orders only for the current page
      const orders = await prisma.order.findMany({
        where: {
          id: { in: paginatedIds },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 6. Sort back to match the paginatedIds sequence and attach scores
      const idIndexMap = new Map(paginatedIds.map((id, index) => [id, index]));
      const sortedMapped = orders
        .map((order) => {
          const trustScore = order.userId
            ? (userCountMap.get(order.userId) || 0)
            : (order.customerPhone ? (phoneCountMap.get(order.customerPhone) || 0) : 0);
          const orderCount = order.userId
            ? (userTotalCountMap.get(order.userId) || 0)
            : (order.customerPhone ? (phoneTotalCountMap.get(order.customerPhone) || 0) : 0);
          return {
            ...order,
            customerTrustScore: trustScore,
            customerOrderCount: orderCount,
          };
        })
        .sort((a, b) => {
          const idxA = idIndexMap.get(a.id) ?? 999;
          const idxB = idIndexMap.get(b.id) ?? 999;
          return idxA - idxB;
        });

      return NextResponse.json({
        data: sortedMapped,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
