/**
 * Firebase Cloud Messaging service worker for M&M Dates.
 *
 * Handles Web Push for new-expense notifications. Registered by
 * NotificationService at the dedicated scope `/firebase-cloud-messaging-push-scope`
 * so it coexists with Angular's `ngsw-worker.js` (which controls `/`).
 *
 * Messages from the Cloud Function are DATA-ONLY: the function builds `title`
 * and `body`, and this worker renders the notification. That keeps the design
 * in one place and guarantees every push displays a notification (iOS requires it).
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB_84CXwJqjPuVunEVCFJsnkunHk3ExmKQ',
  authDomain: 'mm-dates.firebaseapp.com',
  projectId: 'mm-dates',
  storageBucket: 'mm-dates.firebasestorage.app',
  messagingSenderId: '800703062777',
  appId: '1:800703062777:web:b09c193885287cc1387828',
});

const messaging = firebase.messaging();

const DEFAULT_URL = '/expenses';

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || 'Novo gasto 🍔';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    // Collapse repeated sends for the same expense; renotify so it still alerts.
    tag: data.expenseId || undefined,
    renotify: Boolean(data.expenseId),
    data: { url: data.url || DEFAULT_URL },
  };
  return self.registration.showNotification(title, options);
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
