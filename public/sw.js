// Minimal non-blocking PWA Service Worker
const CACHE_NAME = 'cassa-olympic-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser make regular network requests directly
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
