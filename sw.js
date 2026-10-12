const CACHE_NAME = 'ku-visual-hub-v1.5.0-mv4kop5l';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './data/demos.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './demos/sample-stock-vis.html',
  './demos/bridge-architecture-vis.html',
  './demos/trending-repos-papers-vis.html',
  './demos/mortons-taipei-guide.html'
];

// Install: Cache critical core shell assets & Skip Waiting Immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Message: Allow clients to command new SW to take control
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate: Clean up old cache versions (Scoped to ku-visual-hub- prefix only)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache.startsWith('ku-visual-hub-') && cache !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for demos.json, cache-first with stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // For data/demos.json: Network-first to always get latest registry (bypass browser HTTP disk cache)
  if (url.pathname.includes('/demos.json') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For other same-origin or CDN resources: Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      }).catch((err) => {
        // Return cached or pass through
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

