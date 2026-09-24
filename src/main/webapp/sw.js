// sw.js - KelimePulse Service Worker (Offline Destegi)
const CACHE_NAME = 'kelimepulse-v10';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'main-screen.html',
  'add-word.html',
  'css/style.css',
  'css/add-word-style.css',
  'js/main.js',
  'js/main-screen.js',
  'js/add-word.js',
  'words.json',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Yalnizca GET isteklerini yakala
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Arka planda agdan guncelle (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Ag cevrimdisiysa ve HTML isteniyorsa ana ekrani don
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('main-screen.html');
        }
      });
    })
  );
});

