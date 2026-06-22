/* KORE — Service Worker (PWA offline)
   Estrategia:
   - App shell: precache (cache-first).
   - Base de ejercicios (jsDelivr): stale-while-revalidate.
   - Imágenes de ejercicios (jsDelivr): cache-first con tope.
   - Navegación: network-first con fallback a index.html (offline).
*/
const VERSION = 'kore-v1.0.0';
const SHELL_CACHE = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-data`;
const IMG_CACHE = `${VERSION}-img`;
const IMG_MAX = 220;

const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Base de datos de ejercicios -> stale-while-revalidate
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('exercises.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await network) || new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    })());
    return;
  }

  // Imágenes de ejercicios -> cache-first
  if (url.hostname === 'cdn.jsdelivr.net' && /\.(jpg|jpeg|png|webp)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) { cache.put(req, res.clone()); trimCache(IMG_CACHE, IMG_MAX); }
        return res;
      } catch (_) { return new Response('', { status: 504 }); }
    })());
    return;
  }

  // Mismo origen
  if (url.origin === self.location.origin) {
    // Navegación -> network-first con fallback a shell
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
      );
      return;
    }
    // Otros recursos del shell -> cache-first
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
