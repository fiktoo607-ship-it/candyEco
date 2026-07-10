"use client";

import { useEffect, useState } from 'react';

// Helper function to convert VAPID public key to Uint8Array for PushManager subscription
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

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // iOS detection state
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect feature support
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    setIsSupported(supported);

    if (!supported) {
      setLoading(false);
      return;
    }

    // 2. Detect iOS and Standalone status
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    setPermission(Notification.permission);

    // 3. Register SW and get current subscription status
    async function checkCurrentSubscription() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err: any) {
        console.error('Error checking push subscription:', err);
        setError("Impossible de vérifier l'état des notifications.");
      } finally {
        setLoading(false);
      }
    }

    checkCurrentSubscription();
  }, []);

  // Request permission & subscribe
  const handleSubscribe = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // 1. Register service worker (in case it wasn't already)
      const registration = await navigator.serviceWorker.ready;

      // 2. Request Notification Permission
      const userPermission = await Notification.requestPermission();
      setPermission(userPermission);

      if (userPermission !== 'granted') {
        throw new Error("L'autorisation pour les notifications a été refusée.");
      }

      // 3. Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("La clé VAPID publique n'est pas configurée.");
      }

      // 4. Subscribe with PushManager
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // 5. Send subscription info to database
      const res = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
        throw new Error("Échec de l'enregistrement de l'abonnement sur le serveur.");
      }

      setIsSubscribed(true);
      setSuccess("Notifications activées avec succès !");
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || "Une erreur est survenue lors de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe
  const handleUnsubscribe = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Remove from backend database
        const res = await fetch(`/api/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          console.warn("L'abonnement n'a pas pu être retiré du serveur, désinscription locale en cours...");
        }

        // 2. Unsubscribe locally
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setSuccess("Notifications désactivées avec succès.");
    } catch (err: any) {
      console.error('Unsubscription error:', err);
      setError(err.message || "Une erreur est survenue lors de la désactivation.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-md text-center max-w-md mx-auto shadow-sm select-none">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-xs">notifications_off</span>
        <h3 className="font-display font-bold text-on-surface">Notifications non supportées</h3>
        <p className="text-xs text-on-surface-variant mt-xxs">
          Votre navigateur actuel ou votre système d&apos;exploitation ne prend pas en charge les notifications Web Push.
        </p>
      </div>
    );
  }

  // Show iOS-specific instructions if on iOS and app is not installed
  const showIOSInstallationHelp = isIOS && !isStandalone;

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft hover:shadow-md transition-shadow max-w-md w-full">
      <div className="flex items-start gap-sm">
        <div className="rounded-full bg-primary/10 p-sm text-primary shrink-0">
          <span className="material-symbols-outlined text-2xl select-none">
            {isSubscribed ? 'notifications_active' : 'notifications'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-on-surface text-base">
            Notifications de commande
          </h3>
          <p className="text-xs text-on-surface-variant mt-xxs">
            Recevez des alertes en temps réel concernant l&apos;évolution de vos commandes ou des mises à jour de stock.
          </p>

          {/* iOS Guidelines (Requirement 20) */}
          {showIOSInstallationHelp && (
            <div className="mt-md rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 p-xs text-xs text-amber-800 dark:text-amber-300">
              <div className="flex gap-xs items-start">
                <span className="material-symbols-outlined text-base select-none shrink-0 mt-xxs">install_mobile</span>
                <div>
                  <p className="font-semibold">Installation requise sur iOS</p>
                  <p className="mt-xxs leading-relaxed">
                    Pour recevoir des notifications sur iPhone ou iPad, vous devez ajouter cette application à votre écran d&apos;accueil :
                  </p>
                  <ol className="list-decimal list-inside mt-xs pl-xxs space-y-xxs">
                    <li>Appuyez sur le bouton de partage <span className="font-bold">partager</span> (en bas de l&apos;écran dans Safari).</li>
                    <li>Faites défiler vers le bas et sélectionnez <span className="font-bold">&quot;Sur l&apos;écran d&apos;accueil&quot;</span>.</li>
                    <li>Ouvrez l&apos;application depuis votre écran d&apos;accueil pour activer les notifications.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Browser blocked permission notice */}
          {permission === 'denied' && (
            <div className="mt-sm rounded-xl bg-error/5 border border-error-container/20 p-xs text-xs text-error">
              <div className="flex gap-xs items-center">
                <span className="material-symbols-outlined text-base select-none shrink-0">warning</span>
                <p>
                  Les notifications sont bloquées. Veuillez réinitialiser les permissions du site dans la barre d&apos;adresse pour les activer.
                </p>
              </div>
            </div>
          )}

          {/* Success / Error Banners */}
          {success && (
            <div className="mt-sm rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 p-xs text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-xs">
              <span className="material-symbols-outlined text-base select-none">check_circle</span>
              <p>{success}</p>
            </div>
          )}

          {error && (
            <div className="mt-sm rounded-xl bg-error/5 border border-error-container/20 p-xs text-xs text-error flex items-center gap-xs">
              <span className="material-symbols-outlined text-base select-none">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* Toggle Action Buttons (Only if not restricted by iOS home screen requirement) */}
          {(!isIOS || isStandalone) && (
            <div className="mt-md flex gap-sm">
              {isSubscribed ? (
                <button
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="rounded-xl border border-outline hover:bg-surface-container-low px-md py-sm text-xs font-semibold text-on-surface transition-all select-none flex items-center gap-xs disabled:opacity-50"
                >
                  {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-on-surface border-t-transparent inline-block" />}
                  Désactiver les alertes
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading || permission === 'denied'}
                  className="rounded-xl bg-primary hover:bg-surface-tint hover:scale-[1.02] active:scale-95 px-md py-sm text-xs font-semibold text-white shadow-soft transition-all select-none flex items-center gap-xs disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />}
                  M&apos;abonner aux notifications
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
