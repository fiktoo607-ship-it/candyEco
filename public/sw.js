const CACHE_NAME = 'candy-eco-v1';
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
