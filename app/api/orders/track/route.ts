import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function verifyCustomer(order: any, token: string): boolean {
  if (!token) return false;
  const cleanToken = token.trim();

  // Check email match (case-insensitive)
  if (order.customerEmail && order.customerEmail.trim().toLowerCase() === cleanToken.toLowerCase()) {
    return true;
  }

  // Check phone match
  if (order.customerPhone) {
    if (order.customerPhone.trim() === cleanToken) {
      return true;
    }
    const normOrderPhone = normalizePhone(order.customerPhone);
    const normTokenPhone = normalizePhone(cleanToken);
    if (normOrderPhone && normTokenPhone && normOrderPhone === normTokenPhone) {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip, {
      keyPrefix: 'guest_track',
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }

    const body = await request.json().catch(() => ({}));
    const reference = body.reference?.trim();
    const token = (body.token || body.phone || body.email || body.verificationToken)?.trim();

    if (!reference) {
      return NextResponse.json(
        { error: 'Numéro de référence de commande requis' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Numéro de téléphone ou email de vérification requis' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { reference: { equals: reference, mode: 'insensitive' } },
          { id: reference },
        ],
      },
      include: {
        items: {
          include: {
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
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    if (!verifyCustomer(order, token)) {
      return NextResponse.json(
        { error: 'Coordonnées de vérification incorrectes pour cette commande' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: order.id,
      reference: order.reference,
      status: order.status,
      totalPrice: order.totalPrice,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      deliveryMethod: order.deliveryMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items,
    });
  } catch (error) {
    console.error('[Guest Order Tracking Error]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(ip, {
      keyPrefix: 'guest_track',
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateLimit.success) {
      return createRateLimitResponse(rateLimit);
    }

    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference')?.trim() || searchParams.get('ref')?.trim();
    const token = (searchParams.get('token') || searchParams.get('phone') || searchParams.get('email') || searchParams.get('verificationToken'))?.trim();

    if (!reference) {
      return NextResponse.json(
        { error: 'Numéro de référence de commande requis' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Numéro de téléphone ou email de vérification requis' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { reference: { equals: reference, mode: 'insensitive' } },
          { id: reference },
        ],
      },
      include: {
        items: {
          include: {
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
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      );
    }

    if (!verifyCustomer(order, token)) {
      return NextResponse.json(
        { error: 'Coordonnées de vérification incorrectes pour cette commande' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: order.id,
      reference: order.reference,
      status: order.status,
      totalPrice: order.totalPrice,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      deliveryMethod: order.deliveryMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items,
    });
  } catch (error) {
    console.error('[Guest Order Tracking Error]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}
