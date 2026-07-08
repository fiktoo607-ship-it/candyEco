export function initTabVisibilityNotifier() {
  if (typeof window === 'undefined' || !('Notification' in window)) return () => {};

  // Register service worker to support reliable background notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .catch((err) => {
        console.error('Service worker registration failed for TabVisibility:', err);
      });
  }

  // Request permission on first user click gesture (browser requirement)
  const requestPermissionOnGesture = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch((err) => {
        console.warn('Failed to request notification permission:', err);
      });
    }
    document.removeEventListener('click', requestPermissionOnGesture);
  };
  
  if (Notification.permission === 'default') {
    document.addEventListener('click', requestPermissionOnGesture);
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // 1. Play the short notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch((err) => {
          console.warn('Failed to play notification sound:', err);
        });
      } catch (err) {
        console.warn('Audio API not supported or failed to initialize:', err);
      }

      // 2. Trigger browser desktop notification if permission is granted
      if (Notification.permission === 'granted') {
        const title = 'Revenez vite ! 🍰';
        const options = {
          body: 'Ne manquez pas vos gourmandises préférées sur Délices d\'Eva !',
          icon: '/logo.jpeg',
          tag: 'tab-away',
        };

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((registration) => {
              registration.showNotification(title, options);
            })
            .catch((err) => {
              console.warn('Failed to trigger background notification via service worker:', err);
              // Fallback to standard Notification constructor
              try {
                new Notification(title, options);
              } catch (e) {
                console.error(e);
              }
            });
        } else {
          try {
            new Notification(title, options);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('click', requestPermissionOnGesture);
  };
}
