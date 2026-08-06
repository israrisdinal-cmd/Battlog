// sw.js v1.5.11 TABFIX V3 - FORCE CLEAR CACHE
const CACHE_NAME = 'battlog-v1-5-11-tabfix-v3';
const CACHE_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => caches.open(CACHE_NAME).then(c => c.addAll(CACHE_URLS)))
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  // FORCE network-first for JS/CSS/HTML to avoid stale cache
  if(e.request.url.includes('/js/') || e.request.url.includes('/css/') || e.request.url.endsWith('index.html') || e.request.url.endsWith('/battlog/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(res => {
        if(res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
        }
        return res;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }
  // Others stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if(res.ok && res.status!==304) {
          caches.open(CACHE_NAME).then(c=>c.put(e.request, res.clone()));
        }
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
