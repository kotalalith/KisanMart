// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// Parse query params passed during service worker registration
const params = new URL(self.location).searchParams;
const apiKey = params.get('apiKey');
const projectId = params.get('projectId') || 'agromarket-a0466';
const authDomain = params.get('authDomain') || `${projectId}.firebaseapp.com`;
const storageBucket = params.get('storageBucket') || `${projectId}.firebasestorage.app`;
const messagingSenderId = params.get('messagingSenderId') || '139315316077';
const appId = params.get('appId') || '';

// Initialize the Firebase app in the service worker dynamically
if (apiKey) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  });

  const messaging = firebase.messaging();

  // Customize background notification handling
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message payload received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'KisanMart Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'New marketplace notification received.',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: {
        clickAction: payload.data?.clickAction || '/'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click to navigate to deep link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.clickAction || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(clickAction);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
