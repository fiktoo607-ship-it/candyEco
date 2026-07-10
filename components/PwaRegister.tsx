"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PwaRegister() {
  const pathname = usePathname();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Only register service worker in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          setRegistration(reg);

          // Check for updatefound event
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                }
              });
            }
          });

          // Check if there is already a waiting worker on page load
          if (reg.waiting) {
            setUpdateAvailable(true);
          }
        })
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });

      // Reload page when the new active service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Do not show update alert if user is filling checkout details
  const isCheckout = pathname === '/cart';

  if (!updateAvailable || isCheckout) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[95] max-w-sm rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-xs">
        <p className="text-sm font-bold text-on-surface">
          Mise à jour disponible
        </p>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Une nouvelle version de l&apos;application est prête. Mettez à jour pour profiter des dernières fonctionnalités.
        </p>
        <div className="flex gap-sm mt-xs justify-end">
          <button
            onClick={() => setUpdateAvailable(false)}
            className="rounded-lg px-md py-sm text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            Ignorer
          </button>
          <button
            onClick={handleUpdate}
            className="rounded-lg bg-primary hover:bg-surface-tint px-md py-sm text-xs font-semibold text-white transition-colors"
          >
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  );
}
