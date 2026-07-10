import 'server-only';
import webpush from './webpush';
import { prisma } from './prisma';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
}

export async function sendPushNotification(userId: string, payload: PushNotificationPayload) {
  // 1. Fetch all subscriptions for the given userId
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { success: true, sentCount: 0, results: [] };
  }

  // 2. Prepare payload string
  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/logo.jpeg',
    badge: payload.badge || '/logo.jpeg',
    tag: payload.tag || 'general',
    data: payload.data || {},
  });

  // 3. Send notifications to all devices in parallel using Promise.allSettled
  const sendPromises = subscriptions.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    const options = {
      TTL: 24 * 60 * 60, // 24 hours in seconds
    };

    return webpush.sendNotification(pushSubscription, payloadString, options)
      .then(() => ({ endpoint: sub.endpoint, success: true }))
      .catch(async (error: any) => {
        // Automatically delete subscription when Push Service responds with 404 or 410
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Push subscription expired or invalid (status ${error.statusCode}). Deleting endpoint: ${sub.endpoint}`);
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint },
          }).catch(err => {
            console.error(`Failed to delete expired subscription ${sub.endpoint}:`, err);
          });
        }
        throw error;
      });
  });

  const results = await Promise.allSettled(sendPromises);

  return {
    success: true,
    sentCount: subscriptions.length,
    results: results.map((r) => (r.status === 'fulfilled' ? { status: 'fulfilled' as const, ...r.value } : { status: 'rejected' as const, reason: r.reason })),
  };
}
