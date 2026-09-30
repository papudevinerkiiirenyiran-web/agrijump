/* AgriJump — Service Worker
 *
 * Strategy
 *   HTML / navigations → network first, fall back to the cached shell
 *   Same-origin assets → network first, fall back to cache
 *   Third-party (tiles, DiceBear, Picsum) → pass straight through
 *
 * "Network first" on assets matters more than it looks: Next.js chunk
 * filenames are content-hashed, so a stale cached chunk is never the
 * right answer once the page HTML has moved on. Cache-first here caused
 * a half-loaded UI (form rendered, map chunk missing) whenever the
 * device was pointed at a different host than the one that filled the
 * cache. Falling back to the cache keeps the offline story intact.
 */

const CACHE = 'agrijump-v2';
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
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
  // Third-party requests (map tiles, avatars, photos) pass straight through
  if (url.origin !== self.location.origin) return;

  const isHTML =
    req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (isHTML ? caches.match('/') : undefined))
      )
  );
});
