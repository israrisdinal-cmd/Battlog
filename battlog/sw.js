/* BattLog SW V1.5.4 CLEAN - 2026-08-06 */
const CACHE_NAME = 'battlog-v1.5.4-20260806';
const CORE_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS).then(function() {
        return self.skipWaiting();
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) {
          return caches.delete(k);
        })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return caches.open(CACHE_NAME).then(function(cache) {
        return cache.keys().then(function(keys) {
          if (keys.length > 60) {
            var toDelete = keys.slice(0, keys.length - 60);
            return Promise.all(toDelete.map(function(k) { return cache.delete(k); }));
          }
        });
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  var isApi = url.pathname.indexOf('/api/') !== -1 || url.hostname.indexOf('workers.dev') !== -1;
  var isTile = url.hostname.indexOf('cartocdn') !== -1 || url.hostname.indexOf('osrm') !== -1 || url.hostname.indexOf('basemaps') !== -1 || url.hostname.indexOf('tile') !== -1;
  var isNavigate = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isApi) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(JSON.stringify({ offline: true, ok: false }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  if (isTile) {
    return;
  }

  if (isNavigate) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        }
        if (response && response.status === 304) {
          return caches.match(event.request).then(function(cached) {
            return cached || response;
          });
        }
        return response;
      }).catch(function() {
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          return caches.match('./').then(function(r) {
            return r || caches.match('./index.html');
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (event.request.method === 'GET' && response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function() {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
