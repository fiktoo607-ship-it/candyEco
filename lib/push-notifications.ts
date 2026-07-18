import webPush from 'web-push';
import { prisma } from './prisma';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn('[Web Push] VAPID keys are not fully configured in environment variables.');
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: any;
}

export interface PushTarget {
  userId?: string;
  deviceToken?: string;
  role?: 'admin' | 'user';
  all?: boolean;
}

/**
 * Sends a Web Push notification to a target (user ID, device/session token, or users with a specific role).
 * Automatically handles cleaning up stale (404/410) subscriptions from the database.
 */
export async function sendPushNotification(
  target: PushTarget,
  payload: PushPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('[Web Push] Cannot send push notification: VAPID keys not configured.');
    return;
  }

  // Build the database query to find target subscriptions
  const whereClause: any = {};

  if (target.all) {
    // Empty whereClause means match all subscriptions
  } else if (target.userId) {
    whereClause.userId = target.userId;
  } else if (target.deviceToken) {
    whereClause.deviceToken = target.deviceToken;
  } else if (target.role) {
    whereClause.user = { role: target.role };
  } else {
    console.warn('[Web Push] No target specified for sending push notification.');
    return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    });

    if (subscriptions.length === 0) {
      console.log('[Web Push] No subscriptions found for the specified target.');
      return;
    }

    console.log(`[Web Push] Sending push notification to ${subscriptions.length} active device subscription(s).`);

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webPush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/logo.jpeg',
            url: payload.url || '/',
            data: payload.data || {},
          })
        );
      } catch (error: any) {
        // 410 Gone or 404 Not Found indicates the user has unsubscribed or the token has expired
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Web Push] Pruning stale subscription for endpoint: ${sub.endpoint}`);
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          }).catch((pruneErr) => {
            console.error('[Web Push] Failed to delete pruned subscription:', pruneErr);
          });
        } else {
          console.error(`[Web Push] Error sending to endpoint ${sub.endpoint}:`, error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('[Web Push] Error querying subscriptions or executing notifications:', error);
  }
}
