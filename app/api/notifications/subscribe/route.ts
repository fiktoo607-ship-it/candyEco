import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { handleServerError } from '@/lib/api-error-handler';

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

    // Verify endpoint ownership before updating (Issue #47)
    // Prevent re-binding an existing user's endpoint to an arbitrary or unauthenticated user
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existingSubscription && existingSubscription.userId) {
      if (existingSubscription.userId !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: Endpoint is already registered to another user account' },
          { status: 403 }
        );
      }
    }

    // We store/upsert the subscription in the database using the unique endpoint
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        expirationTime: expirationTime ? parseFloat(expirationTime) : null,
        p256dh,
        auth,
        userId: userId || existingSubscription?.userId || null,
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
    return handleServerError(error, '[Subscribe API] Error saving subscription:', 'Failed to save subscription');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require authentication for DELETE requests (Issue #47)
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint field' },
        { status: 400 }
      );
    }

    // Verify endpoint ownership before deleting
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existingSubscription) {
      // Regular users can only unregister their own endpoint; admins can unregister any
      if (
        existingSubscription.userId &&
        existingSubscription.userId !== session.user.id &&
        session.user.role !== 'admin'
      ) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot delete subscription of another user' },
          { status: 403 }
        );
      }

      await prisma.pushSubscription.delete({
        where: { endpoint },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleServerError(error, '[Subscribe API] Error deleting subscription:', 'Failed to delete subscription');
  }
}

