const CACHE_NAME = 'circlepos-cache-v1';
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/assets/icon-192.svg', '/assets/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(PRECACHE_URLS); } catch (e) { /* ignore */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      try { cache.put(event.request, res.clone()); } catch(e) {}
      return res;
    } catch {
      return caches.match('/index.html');
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
