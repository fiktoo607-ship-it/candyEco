"use client";

import { useEffect } from 'react';

export default function TabVisibilityNotifier() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Unregister legacy active service workers to ensure obsolete sw registrations are purged (preserving the new sw.js only in production)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            const scriptURL =
              registration.active?.scriptURL ||
              registration.installing?.scriptURL ||
              registration.waiting?.scriptURL ||
              '';
            if (scriptURL.includes('sw.js')) {
              continue;
            }
            registration.unregister().catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
