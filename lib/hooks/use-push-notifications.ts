"use client";

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Converts a URL-safe Base64 VAPID public key into a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Checks support and current subscription status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSupportAndSubscription = async () => {
      const userAgent = window.navigator.userAgent || "";
      const ios =
        /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(ios);

      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true;
      setIsStandalone(standalone);

      const isSwSupported = "serviceWorker" in navigator;
      const isPushSupported = "PushManager" in window;
      const supported = isSwSupported && isPushSupported;
      setIsSupported(supported);

      if (!supported) {
        setLoading(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        // Manually registers or gets the service worker at /sw.js
        let registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
          registration = await navigator.serviceWorker.register("/sw.js", {
            updateViaCache: "none",
          });
          console.log(
            "[Push SDK] Service Worker registered manually:",
            registration.scope,
          );
        }

        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        setIsSubscribed(!!sub);

        if (sub) {
          // Sync with database to ensure it's persisted in the active environment
          fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscription: sub.toJSON(),
            }),
          })
            .then((res) => {
              if (res.ok) {
                console.log(
                  "[Push SDK] Subscription synchronized with database.",
                );
              } else {
                console.warn(
                  "[Push SDK] Subscription sync returned non-OK status.",
                );
              }
            })
            .catch((err) => {
              console.warn(
                "[Push SDK] Failed to sync subscription with database:",
                err,
              );
            });
        }
      } catch (err) {
        console.error("[Push SDK] Error checking subscription status:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSupportAndSubscription();
  }, []);

  /**
   * Subscribes the user to push notifications.
   * Prompts for permission if needed.
   * Sends subscription details to the Next.js API route.
   */
  const subscribeToPush = useCallback(
    async (deviceToken?: string) => {
      if (!isSupported) {
        console.warn(
          "[Push SDK] Push notifications are not supported on this browser.",
        );
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error(
          "[Push SDK] VAPID Public Key is missing in environment variables.",
        );
        return;
      }

      setLoading(true);
      try {
        let currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
        
        if (currentPermission === 'denied') {
          const alertMsg = "Les notifications sont bloquées pour ce site. Veuillez appuyer sur l'icône de cadenas ou ouvrir les paramètres Chrome / Android pour autoriser les notifications.";
          if (typeof window !== 'undefined') {
            alert(alertMsg);
          }
          setPermission('denied');
          return;
        }

        // 1. Request notification permission
        const requestedPermission = await Notification.requestPermission();
        setPermission(requestedPermission);

        if (requestedPermission !== "granted") {
          if (typeof window !== 'undefined') {
            alert("Autorisation de notification refusée. Veuillez autoriser les notifications dans les paramètres du navigateur.");
          }
          return;
        }

        // 2. Ensure service worker is registered and ready
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register("/sw.js", {
            updateViaCache: "none",
          });
        }

        const swReady = await navigator.serviceWorker.ready;

        // 3. Format VAPID key and subscribe
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        const sub = await swReady.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // 4. Send subscription JSON payload to Next.js API route
        const res = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            deviceToken,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || "Failed to save subscription on backend",
          );
        }

        setSubscription(sub);
        setIsSubscribed(true);
        console.log("[Push SDK] Push notification subscribed successfully.");
      } catch (err: any) {
        console.error(
          "[Push SDK] Failed to subscribe to push notifications:",
          err,
        );
        if (typeof window !== 'undefined' && err?.message && !err.message.includes('denied')) {
          alert(`Erreur lors de l'activation des notifications: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [isSupported],
  );

  /**
   * Unsubscribes the user from push notifications.
   * Revokes subscription from push service provider and deletes it from database.
   */
  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported || !subscription) return;

    setLoading(true);
    try {
      // 1. Delete subscription from push service provider (FCM/APNS)
      await subscription.unsubscribe();

      // 2. Delete subscription from our database
      const res = await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Failed to delete subscription on backend",
        );
      }

      setSubscription(null);
      setIsSubscribed(false);
      console.log("[Push SDK] Push notification unsubscribed successfully.");
    } catch (err) {
      console.error(
        "[Push SDK] Failed to unsubscribe from push notifications:",
        err,
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isSupported, subscription]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    loading,
    subscribeToPush,
    unsubscribeFromPush,
    isIOS,
    isStandalone,
  };
}