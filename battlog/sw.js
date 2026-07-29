/* BattLog Service Worker v1.5.2 FIXED - tanpa ubah layout, cuma fix bug offline */
const CACHE_NAME = 'battlog-v1.5.2-20260729';
const CORE_ASSETS = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      // FIX: pakai allSettled biar 1 gagal tidak bikin semua gagal
      return Promise.allSettled(CORE_ASSETS.map(u => cache.add(u))).then(()=> self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isApi = url.pathname.includes('/api/') || url.hostname.includes('workers.dev');
  const isTile = url.hostname.includes('cartocdn') || url.hostname.includes('osrm') || url.hostname.includes('basemaps') || url.hostname.includes('tile');

  // FIX: API offline harus 503, bukan 200
  if (isApi) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ offline: true, ok: false }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // FIX: Tile peta jangan di-cache di SW biar tidak bengkak
  if (isTile) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (event.request.method === 'GET' && response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./').then(r => r || caches.match('./index.html') || caches.match('/'));
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
