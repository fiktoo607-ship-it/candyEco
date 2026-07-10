// Service Worker for Web Push Notifications

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event with no data');
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Délices d\'Eva',
      body: event.data.text()
    };
  }

  const title = data.title || 'Délices d\'Eva';
  
  // Requirement 6: support title, body, icon, badge, tag, and URL (within custom data object)
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.jpeg',
    badge: data.badge || '/logo.jpeg',
    tag: data.tag || 'general-push',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Requirement 6: open the correct page (URL) when the notification is clicked
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Look for a client window that matches our target URL or origin
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no exact matching window was found, focus any window from our site and navigate it,
      // or open a new window
      if (clientList.length > 0) {
        const client = clientList[0];
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
