import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST: Save or update subscription via upsert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    // Validate request structure (Requirement 12: do not trust client data)
    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing endpoint' }, { status: 400 });
    }

    if (!keys || typeof keys !== 'object' || !keys.p256dh || !keys.auth || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing keys (p256dh, auth)' }, { status: 400 });
    }

    // Upsert subscription
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json(subscription, { status: 200 });
  } catch (error: any) {
    console.error('[Push Subscription API] Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete current user's subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      // Delete specific subscription by endpoint, but make sure it belongs to the current user
      const existing = await prisma.pushSubscription.findUnique({
        where: { endpoint },
      });

      if (!existing) {
        return NextResponse.json({ message: 'Subscription not found' }, { status: 404 });
      }

      if (existing.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await prisma.pushSubscription.delete({
        where: { endpoint },
      });

      return NextResponse.json({ success: true, message: 'Subscription deleted' });
    } else {
      // If no endpoint is provided, delete all subscriptions for the current user
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id },
      });

      return NextResponse.json({ success: true, message: 'All user subscriptions deleted' });
    }
  } catch (error: any) {
    console.error('[Push Subscription API] Error deleting subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
