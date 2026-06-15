/**
 * Web Push service worker for M&M Dates.
 *
 * Handles Web Push for new-expense notifications. Registered by
 * NotificationService at the dedicated scope `/firebase-cloud-messaging-push-scope`
 * so it coexists with Angular's `ngsw-worker.js` (which controls `/`).
 *
 * We intentionally DO NOT load the Firebase Messaging SDK here. The SDK's
 * internal `push` handler skips showing a notification when it believes a
 * client is visible (a check that is unreliable on iOS PWAs, where suspended
 * windows misreport visibility — firebase-js-sdk #8002). On iOS that means
 * pushes get silently swallowed, and Safari then revokes the push
 * subscription after a few "silent" pushes. A raw `push` listener that ALWAYS
 * calls `showNotification` avoids both problems and satisfies Apple's
 * requirement that every push display a notification.
 *
 * Messages from the Cloud Function are DATA-ONLY: the function builds `title`
 * and `body` inside the `data` map, and this worker renders the notification.
 */

const DEFAULT_URL = '/expenses';

// Take over as soon as the updated worker is installed, so the fixed worker
// replaces any previously-installed one without needing the PWA fully killed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    // Non-JSON payload — fall back to defaults below.
  }
  // The Cloud Function sends both `webpush.notification` and `data`; read the
  // notification first and fall back to data (also handles older payloads).
  const n = payload.notification || {};
  const data = payload.data || {};
  const title = n.title || data.title || 'Novo gasto 🍔';
  const body = n.body || data.body || '';
  const url = data.url || (payload.fcmOptions && payload.fcmOptions.link) || DEFAULT_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      // Collapse repeated sends for the same expense.
      tag: data.expenseId || undefined,
      data: { url },
    }),
  );
});

// Focus an open tab if there is one, otherwise open the expenses page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
