// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDyNx7EZuLhhbBdVRjAk1zU8FClIrndpi0",
  authDomain: "kipo-aac0a.firebaseapp.com",
  projectId: "kipo-aac0a",
  storageBucket: "kipo-aac0a.firebasestorage.app",
  messagingSenderId: "31684502899",
  appId: "1:31684502899:web:8c45a3b29f11869b925106"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Recordatorio de Pago';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un pago pendiente',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data,
    tag: payload.data?.card_id || 'payment-reminder',
    requireInteraction: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard/cards';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
