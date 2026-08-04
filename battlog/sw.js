// sw.js v5.35 FIXED - cache limit + 304 handling
const CACHE_NAME = 'sigan-cache-v5-35';
const MAX_CACHE_ITEMS = 80;
const CACHE_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CACHE_URLS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

async function trimCache(){
  try{
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    if(keys.length > MAX_CACHE_ITEMS){
      // hapus yang paling lama (first 20)
      const toDelete = keys.slice(0, keys.length - MAX_CACHE_ITEMS);
      await Promise.all(toDelete.map(k=>cache.delete(k)));
    }
  }catch(e){}
}

self.addEventListener('fetch', e => {
  // hanya GET
  if(e.request.method !== 'GET') return;
  
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 304 handling: kalau ada di cache, return dulu, tapi revalidate
      const cached = await cache.match(e.request);
      
      const fetchPromise = fetch(e.request).then(async networkRes => {
        // FIX: jangan cache 304, opaque, atau error
        if(!networkRes || networkRes.status===304 || networkRes.status===204 || !networkRes.ok){
          return networkRes;
        }
        // clone & cache hanya untuk same-origin & bukan api nominatim
        if(e.request.url.startsWith(self.location.origin) || e.request.url.includes('openstreetmap')){
          // skip chrome-extension, api gojek
          if(!e.request.url.includes('chrome-extension') && !e.request.url.includes('gojek')){
            try{
              await cache.put(e.request, networkRes.clone());
              // trim cache di background
              trimCache();
            }catch(err){}
          }
        }
        return networkRes;
      }).catch(()=> cached || null);

      // return cache dulu kalau ada (stale-while-revalidate), biar cepat
      if(cached) {
        e.waitUntil(fetchPromise);
        return cached;
      }
      return await fetchPromise;
    })()
  );
});
