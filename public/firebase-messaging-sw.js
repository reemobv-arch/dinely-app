// Firebase Cloud Messaging service worker — toont notificaties als de app dicht staat.
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCI0p4TUFZ-yAtlrGiyl2TtpyXsTUrScCI",
  authDomain: "dinely-e1ba7.firebaseapp.com",
  projectId: "dinely-e1ba7",
  messagingSenderId: "399986192412",
  appId: "1:399986192412:web:92297168845e94de46efd9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || "Dinely", {
    body: n.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(clients.openWindow(url));
});
