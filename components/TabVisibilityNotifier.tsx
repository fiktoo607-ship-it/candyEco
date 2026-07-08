"use client";

import { useEffect } from 'react';

export default function TabVisibilityNotifier() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Force-unregister any active service workers to ensure deleted sw.js is fully purged
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log('Successfully unregistered ghost service worker:', registration.scope);
            }
          });
        }
      }).catch((err) => {
        console.warn('Failed to retrieve service worker registrations:', err);
      });
    }

    // 2. Request Notification permission on mount if default, with user interaction fallback for Chrome
    const requestPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch((err) => {
          console.warn('Failed to request notification permission:', err);
        });
      }
    };

    requestPermission();

    const handleInteraction = () => {
      requestPermission();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    // 3. Monitor tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Play the audio alert playing /notification.mp3
        const audio = new Audio('/notification.mp3');
        audio.play().catch((err) => {
          // Explicitly handle and suppress DOMException errors caused by modern browser 'first-interaction' restrictions
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            console.log('Audio playback prevented by browser autoplay policy (first-interaction restriction).');
          } else {
            console.warn('Audio playback failed:', err);
          }
        });

        // Trigger a brand new browser desktop notification if permission is granted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Revenez vite ! 🍰', {
              body: 'Ne manquez pas vos gourmandises préférées sur Délices d\'Eva !',
              icon: '/logo.jpeg',
              tag: 'tab-away',
            });
          } catch (err) {
            console.error('Failed to trigger desktop notification:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
