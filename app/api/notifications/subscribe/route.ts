import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, {
      keyPrefix: 'push-sub',
      limit: 20,
      windowSeconds: 300, // 5 minutes
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop de requêtes d\'abonnement aux notifications.'
      );
    }

    const body = await request.json();
    const { subscription, deviceToken } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json(
        { error: 'Missing required subscription fields' },
        { status: 400 }
      );
    }

    const { endpoint, expirationTime, keys } = subscription;
    const { p256dh, auth } = keys;

    // Get current user session if authenticated
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // We store/upsert the subscription in the database using the unique endpoint
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        expirationTime: expirationTime ? parseFloat(expirationTime) : null,
        p256dh,
        auth,
        userId,
        deviceToken: deviceToken || null,
      },
      create: {
        endpoint,
        expirationTime: expirationTime ? parseFloat(expirationTime) : null,
        p256dh,
        auth,
        userId,
        deviceToken: deviceToken || null,
      },
    });

    console.log(`[Subscribe API] Subscription saved/updated. ID: ${pushSubscription.id}, userId: ${userId}, deviceToken: ${deviceToken}`);
    return NextResponse.json({ success: true, id: pushSubscription.id });
  } catch (error: any) {
    console.error('[Subscribe API] Error saving subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint field' },
        { status: 400 }
      );
    }

    // Delete the subscription matching the endpoint
    const deleteResult = await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    console.log(`[Subscribe API] Unregistered endpoint. Deleted count: ${deleteResult.count}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Subscribe API] Error deleting subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
