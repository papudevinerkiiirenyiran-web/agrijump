/* AgriJump — Service Worker (minimal)
 * Strategy: HTML / data → network first; static assets → cache first; everything else → passthrough.
 * When a real backend is wired up, add a few local images to STATIC_ASSETS. */

const CACHE = 'agrijump-v1';
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Third-party requests (map tiles, DiceBear, Picsum) pass straight through
  if (url.origin !== self.location.origin) return;

  // HTML: network first, fall back to the cached shell
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Other same-origin assets: cache first with background refresh
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
    )
  );
});