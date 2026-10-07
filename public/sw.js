const CACHE_NAME = 'candy-eco-v2';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  OFFLINE_URL,
  '/logo.jpeg',
  '/notification.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Purging obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Only same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // 2. Only GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Exclude webpack HMR, hot updates, and dev server internals
  if (
    url.pathname.startsWith('/_next/static/webpack/') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Do not intercept or cache _next/ assets on localhost/dev
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (isLocalhost && url.pathname.startsWith('/_next/')) {
    return;
  }

  // Exclude auth, admin, SSE, dashboard, uploads, orders, and writes
  const isExcluded =
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/orders') ||
    url.pathname.startsWith('/api/upload') ||
    url.pathname.startsWith('/api/notifications') ||
    url.pathname.startsWith('/api/users') ||
    url.pathname.startsWith('/api/config') ||
    url.pathname.startsWith('/api/delivery-methods') ||
    url.pathname.startsWith('/api/carousel-slides');

  if (isExcluded) {
    return;
  }

  // 3. Navigation requests -> Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // 4. Static / Immutable Assets -> Cache-First
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|css|js)$/) ||
    STATIC_ASSETS.includes(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Product APIs -> Network-First with Cache fallback
  const isProductApi =
    url.pathname.startsWith('/api/products') ||
    url.pathname.startsWith('/api/tags') ||
    url.pathname.startsWith('/api/faqs');

  if (isProductApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
});

// Skip waiting message event listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper function to sanitize notification URLs and prevent Open Redirect / XSS
function sanitizeNotificationUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '/';
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '/';
  }

  // Explicitly deny dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return '/';
  }

  // Deny protocol-relative URLs (e.g. //attacker.com)
  if (trimmed.startsWith('//')) {
    return '/';
  }

  try {
    // Relative path check: starts with single '/'
    if (trimmed.startsWith('/')) {
      const resolved = new URL(trimmed, self.location.origin);
      if (resolved.origin === self.location.origin) {
        return resolved.pathname + resolved.search + resolved.hash;
      }
      return '/';
    }

    // Absolute URL check: must strictly match same origin and safe protocol
    const parsed = new URL(trimmed, self.location.origin);
    if (
      parsed.origin === self.location.origin &&
      (parsed.protocol === 'http:' || parsed.protocol === 'https:')
    ) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (err) {
    return '/';
  }

  return '/';
}

// Push notification event listener
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[Service Worker] Push event received with no data.');
    return;
  }

  let payload = {
    title: 'Candy Eco',
    body: 'Vous avez une nouvelle notification.',
    icon: '/logo.jpeg',
    url: '/',
  };

  try {
    const parsedData = event.data.json();
    payload = {
      title: parsedData.title || payload.title,
      body: parsedData.body || payload.body,
      icon: parsedData.icon || payload.icon,
      url: sanitizeNotificationUrl(parsedData.url || payload.url),
      data: parsedData.data || {},
    };
  } catch (err) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: '/logo.jpeg',
    data: {
      url: sanitizeNotificationUrl(payload.url),
      ...payload.data
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification click event listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickUrl = sanitizeNotificationUrl(event.notification.data?.url);
  const targetFullUrl = new URL(clickUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find an open window matching the origin and focus it
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if (client.url !== targetFullUrl && 'navigate' in client) {
            client.navigate(clickUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(clickUrl);
      }
    })
  );
});
