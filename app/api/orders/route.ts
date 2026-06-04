import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RequestItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, shippingAddress, items, sessionId } = body;

    if (!customerName || !customerPhone || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required guest customer or cart information' }, { status: 400 });
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

    // 3. Atomically write Order, OrderItems, and PointsTransaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          sessionId,
          status: 'PENDING',
          totalPrice,
          totalAmount,
          customerName,
          customerPhone,
          shippingAddress,
          pointsEarned,
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

      return order;
    });

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

    const skip = (page - 1) * limit;

    // Build filters dynamically
    interface QueryCondition {
      status?: string;
      OR?: Array<{
        customerName?: { contains: string; mode: 'insensitive' };
        customerPhone?: { contains: string; mode: 'insensitive' };
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
        { shippingAddress: { contains: query, mode: 'insensitive' } },
        { id: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Fetch in parallel
    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      data: orders,
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
