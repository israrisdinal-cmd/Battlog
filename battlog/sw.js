/* BattLog SW V1.5.3 STABLE - FIX CACHE - 2026-07-30
   FIX: HTML pakai network-first biar update keyboard langsung ke-load, tidak ke-cache lama
*/
const CACHE_NAME = 'battlog-v1.5.3-stable-telegram-20260730';
const CORE_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
  const isNavigate = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isApi) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ offline: true, ok: false }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  if (isTile) {
    return; // jangan cache tile peta
  }

  // FIX UTAMA: HTML pakai network-first, bukan cache-first
  if (isNavigate) {
    event.respondWith(
      fetch(event.request).then((response) => {
        // simpan versi terbaru ke cache untuk offline fallback
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // offline -> fallback ke cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          return caches.match('./').then(r => r || caches.match('./index.html'));
        });
      })
    );
    return;
  }

  // asset lain: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (event.request.method === 'GET' && response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
