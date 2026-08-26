import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteConfig } from '@/lib/config';

import crypto from 'crypto';

/**
 * Generates an atomic, collision-resistant order reference in format: ORD-YYYYMMDD-XXX
 * Uses PostgreSQL sequence (nextval) when connected to Postgres, with a cryptographically
 * collision-resistant fallback when sequences are unavailable or in test environments.
 */
export async function generateAtomicOrderReference(tx: any, date: Date = new Date()): Promise<string> {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const datePrefix = `ORD-${yyyy}${mm}${dd}-`;

  try {
    const result = await tx.$queryRaw`SELECT nextval('order_reference_seq') as seq`;
    if (result && Array.isArray(result) && result.length > 0) {
      const rawVal = result[0]?.seq ?? result[0]?.nextval;
      if (rawVal !== undefined && rawVal !== null) {
        const seqNum = Number(rawVal);
        if (!isNaN(seqNum)) {
          const seqStr = String(((seqNum - 1) % 999) + 1).padStart(3, '0');
          return `${datePrefix}${seqStr}`;
        }
      }
    }
  } catch (err: any) {
    // If sequence does not exist in the database, attempt to create it once
    try {
      await tx.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS order_reference_seq START 1`);
      const retryResult = await tx.$queryRaw`SELECT nextval('order_reference_seq') as seq`;
      if (retryResult && Array.isArray(retryResult) && retryResult.length > 0 && retryResult[0]?.seq !== undefined) {
        const seqNum = Number(retryResult[0].seq);
        const seqStr = String(((seqNum - 1) % 999) + 1).padStart(3, '0');
        return `${datePrefix}${seqStr}`;
      }
    } catch {
      // In SQLite / in-memory / mock test fallback: use cryptographically secure random bytes
    }
  }

  // Cryptographically secure collision-resistant 4-hex-char suffix
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${datePrefix}${randomSuffix}`;
}

import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id || null;
    const role = session?.user?.role || 'anonymous';
    const clientIp = getClientIp(request);
    const identifier = userId ? `user:${userId}` : `ip:${clientIp}`;

    const limit = role === 'admin' ? 60 : userId ? 15 : 5;
    const rateLimitResult = await checkRateLimit(identifier, {
      keyPrefix: 'orders',
      limit,
      windowSeconds: 60,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult, 'Trop de commandes créées. Veuillez patienter avant de réessayer.');
    }

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

    // 1. Validate items payload structure and quantities
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: 'Le panier doit contenir entre 1 et 50 articles.' }, { status: 400 });
    }

    // Aggregate items by productId to handle duplicate entries securely and cleanly
    const aggregatedItemsMap = new Map<string, number>();

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return NextResponse.json({ error: "Format d'article invalide." }, { status: 400 });
      }

      const { productId, quantity } = item;

      if (!productId || typeof productId !== 'string' || productId.trim() === '' || productId.length > 100) {
        return NextResponse.json({ error: 'Identifiant de produit invalide.' }, { status: 400 });
      }

      if (
        typeof quantity !== 'number' ||
        !Number.isFinite(quantity) ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 100
      ) {
        return NextResponse.json({ error: 'La quantité doit être un entier positif entre 1 et 100.' }, { status: 400 });
      }

      const cleanProductId = productId.trim();
      const currentQty = aggregatedItemsMap.get(cleanProductId) || 0;
      const newQty = currentQty + quantity;

      if (newQty > 100) {
        return NextResponse.json({ error: 'La quantité totale cumulée pour un produit ne peut pas dépasser 100.' }, { status: 400 });
      }

      aggregatedItemsMap.set(cleanProductId, newQty);
    }

    const uniqueProductIds = Array.from(aggregatedItemsMap.keys());

    // 2. Fetch products from database to ensure pricing integrity
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    if (dbProducts.length !== uniqueProductIds.length) {
      return NextResponse.json({ error: 'One or more products in your cart could not be found' }, { status: 400 });
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Validate availability, purchase limits, and calculate total amounts authoritatively
    let totalAmount = 0;
    
    interface OrderItemData {
      productId: string;
      quantity: number;
      priceAtPurchase: string;
      amountAtPurchase: number;
    }
    
    const orderItemsData: OrderItemData[] = [];

    for (const [productId, quantity] of aggregatedItemsMap.entries()) {
      const dbProduct = productMap.get(productId);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product ${productId} not found` }, { status: 400 });
      }

      if (dbProduct.state === 'outofStock') {
        return NextResponse.json({ error: `Product "${dbProduct.title}" is out of stock` }, { status: 400 });
      }

      if (dbProduct.limitBay !== null && dbProduct.limitBay !== undefined && dbProduct.limitBay > 0) {
        if (quantity > dbProduct.limitBay) {
          return NextResponse.json(
            { error: `La quantité pour "${dbProduct.title}" dépasse la limite autorisée (${dbProduct.limitBay}).` },
            { status: 400 }
          );
        }
      }

      const numericPrice = parseFloat(dbProduct.price.replace(/[^0-9.]/g, ''));
      if (isNaN(numericPrice) || numericPrice < 0) {
        return NextResponse.json({ error: 'Prix de produit invalide dans la base de données' }, { status: 500 });
      }

      const itemAmount = Math.round(numericPrice * quantity * 100) / 100;
      totalAmount += itemAmount;

      orderItemsData.push({
        productId,
        quantity,
        priceAtPurchase: dbProduct.price,
        amountAtPurchase: numericPrice,
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const totalPrice = `$${totalAmount.toFixed(2)}`;

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
          const reference = await generateAtomicOrderReference(tx);

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

      const { hasActiveAdminTab } = await import('@/lib/presence');
      const isAdminActive = await hasActiveAdminTab();

      if (isAdminActive) {
        console.log('[Orders API] Active admin tab detected (visibilityState=visible). Skipping Web Push notification.');
      } else {
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
      }
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

      // 3. Fetch fully populated orders for the current page with selective fields
      const orders = paginatedIds.length > 0 ? await tx.order.findMany({
        where: {
          id: { in: paginatedIds },
        },
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

