import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

    const session = await getServerSession(authOptions);
    let userId = session?.user?.id || null;

    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!userExists) {
        userId = null;
      }
    }

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

      // Trigger Web Push notification to all subscribed administrator devices
      const { sendPushNotification } = await import('@/lib/push-notifications');
      const clientName = newOrder.customerName || 'Nouveau Client';
      const amount = newOrder.totalPrice || '0.00 €';
      
      sendPushNotification(
        { role: 'admin' },
        {
          title: 'Nouvelle commande ! 🍰',
          body: `${clientName} a passé une commande de ${amount}.`,
          icon: '/logo.jpeg',
          url: '/dashboard',
          data: { orderId: newOrder.id }
        }
      ).catch((err) => {
        console.error('[Orders API] Failed to dispatch admin Web Push notification:', err);
      });
    } catch (e) {
      console.error('[Orders API] Failed to emit new-order notification:', e);
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    let errMsg = error instanceof Error ? error.message : 'Failed to submit order';
    if (errMsg.includes("Can't reach database server") || errMsg.includes("prisma") || errMsg.includes("pooled.db.prisma.io")) {
      errMsg = "Impossible de contacter le serveur de base de données. Veuillez vérifier votre connexion Internet.";
    }
    console.error('[Orders API] Error creating order:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const isAdmin = session.user.role === 'admin';

    const conditions: Prisma.Sql[] = [];

    if (!isAdmin) {
      conditions.push(Prisma.sql`o."userId" = ${session.user.id}`);
    }

    if (status) {
      conditions.push(Prisma.sql`o.status = ${status.toUpperCase()}`);
    }

    if (query) {
      const ilikeQuery = `%${query}%`;
      conditions.push(Prisma.sql`(
        o."customerName" ILIKE ${ilikeQuery} OR
        o."customerPhone" ILIKE ${ilikeQuery} OR
        o."customerEmail" ILIKE ${ilikeQuery} OR
        o."shippingAddress" ILIKE ${ilikeQuery} OR
        o.id::text ILIKE ${ilikeQuery} OR
        o.reference ILIKE ${ilikeQuery}
      )`);
    }

    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    // Determine orderBy clause
    let orderBySql: Prisma.Sql;
    if (sortBy === 'trustScore') {
      orderBySql = sortOrder === 'asc' 
        ? Prisma.sql`ORDER BY "customerTrustScore" ASC, o."createdAt" DESC` 
        : Prisma.sql`ORDER BY "customerTrustScore" DESC, o."createdAt" DESC`;
    } else if (sortBy === 'orderCount') {
      orderBySql = sortOrder === 'asc' 
        ? Prisma.sql`ORDER BY "customerOrderCount" ASC, o."createdAt" DESC` 
        : Prisma.sql`ORDER BY "customerOrderCount" DESC, o."createdAt" DESC`;
    } else if (sortBy === 'status') {
      orderBySql = sortOrder === 'asc' 
        ? Prisma.sql`ORDER BY o.status ASC, o."createdAt" DESC` 
        : Prisma.sql`ORDER BY o.status DESC, o."createdAt" DESC`;
    } else {
      // Default to createdAt
      orderBySql = sortOrder === 'asc' 
        ? Prisma.sql`ORDER BY o."createdAt" ASC` 
        : Prisma.sql`ORDER BY o."createdAt" DESC`;
    }

    interface RawOrderResult {
      id: string;
      customerTrustScore: number | bigint;
      customerOrderCount: number | bigint;
    }

    // Wrap in a single transaction for consistent reads
    const { total, rawOrders, orders } = await prisma.$transaction(async (tx) => {
      // 1. Get total count
      const countResult = await tx.$queryRaw<any[]>`
        SELECT COUNT(*) as count
        FROM "Order" o
        ${whereClause}
      `;
      const total = Number(countResult[0]?.count || 0);

      // 2. Fetch paginated orders with computed fields and sorting
      const rawOrders = await tx.$queryRaw<RawOrderResult[]>`
        SELECT
          o.id,
          FLOOR(COALESCE(
            CASE
              WHEN o."userId" IS NOT NULL THEN (
                SELECT SUM(o2."totalAmount")
                FROM "Order" o2
                WHERE o2.status IN ('DELIVERED', 'COMPLETED') AND o2."userId" = o."userId"
              )
              WHEN o."customerPhone" IS NOT NULL THEN (
                SELECT SUM(o2."totalAmount")
                FROM "Order" o2
                WHERE o2.status IN ('DELIVERED', 'COMPLETED') AND o2."customerPhone" = o."customerPhone"
              )
              ELSE 0
            END,
            0
          )) AS "customerTrustScore",
          COALESCE(
            CASE
              WHEN o."userId" IS NOT NULL THEN (
                SELECT COUNT(*)
                FROM "Order" o2
                WHERE o2."userId" = o."userId"
              )
              WHEN o."customerPhone" IS NOT NULL THEN (
                SELECT COUNT(*)
                FROM "Order" o2
                WHERE o2."customerPhone" = o."customerPhone"
              )
              ELSE 0
            END,
            0
          ) AS "customerOrderCount"
        FROM "Order" o
        ${whereClause}
        ${orderBySql}
        LIMIT ${limit} OFFSET ${skip}
      `;

      const paginatedIds = rawOrders.map(o => o.id);

      // 3. Fetch fully populated orders for the current page
      const orders = paginatedIds.length > 0 ? await tx.order.findMany({
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
      }) : [];

      return { total, rawOrders, orders };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    const orderMetricsMap = new Map(rawOrders.map(o => [
      o.id,
      {
        customerTrustScore: Number(o.customerTrustScore),
        customerOrderCount: Number(o.customerOrderCount),
      }
    ]));

    // 4. Map them back to the correct sorting order and attach computed scores
    const idIndexMap = new Map(rawOrders.map((o, index) => [o.id, index]));
    const sortedMapped = orders
      .map((order) => {
        const metrics = orderMetricsMap.get(order.id) || { customerTrustScore: 0, customerOrderCount: 0 };
        return {
          ...order,
          customerTrustScore: metrics.customerTrustScore,
          customerOrderCount: metrics.customerOrderCount,
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
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('[Orders API] Error fetching orders:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

