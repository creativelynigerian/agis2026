// ========================================================
// AGIS 2026 Companion PWA Service Worker
// Theme: FRESH OIL — For Innovative Thinking
// Powered by CCYI Global & Access Chapel
// ========================================================

const CACHE_NAME = 'agis2026-companion-v1.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './style.css',
  './script.js',
  './app.css',
  './app.js',
  './manifest.json',
  './assets/agis-logo.png',
  './assets/creatively-nigerian.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[AGIS 2026 SW] Caching app shell assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[AGIS 2026 SW] Asset caching skipped for some files:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[AGIS 2026 SW] Purging old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Let browser handle external analytics/third-party API directly
  const url = new URL(event.request.url);
  if (url.origin !== self.origin && !url.hostname.includes('cdnjs') && !url.hostname.includes('unpkg')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache external CDN styles/scripts if successful
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for HTML documents when offline
        if (event.request.mode === 'navigate') {
          return caches.match('./app.html') || caches.match('./index.html');
        }
      });
    })
  );
});
