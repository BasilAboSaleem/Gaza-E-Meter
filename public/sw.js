const CACHE_NAME = 'collector-cache-v8';
const STATIC_ASSETS = [
  '/',
  '/collector/my-subscribers',
  '/collector/readings/new',
  '/collector/sync',
  '/assets/js/db.js',
  '/manifest.json',
  '/assets/images/favicon.ico',
  // CSS Files
  '/assets/css/hope-ui.min.css?v=2.0.0',
  '/assets/css/rtl.min.css',
  '/assets/css/core/libs.min.css',
  '/assets/css/custom.min.css?v=2.0.0',
  '/assets/css/dark.min.css',
  '/assets/css/customizer.min.css',
  // JS Files
  '/assets/js/core/libs.min.js',
  '/assets/js/core/external.min.js',
  '/assets/js/hope-ui.js'
];

// External CDN resources to cache
const CDN_ASSETS = [
  'https://unpkg.com/dexie@3/dist/dexie.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      // Cache static assets first
      return cache.addAll(STATIC_ASSETS)
        .then(() => {
          console.log('[SW] Static assets cached');
          // Then try to cache CDN assets (don't fail if they fail)
          return Promise.allSettled(
            CDN_ASSETS.map(url => 
              fetch(url, { mode: 'cors' })
                .then(res => cache.put(url, res))
                .catch(err => console.warn('[SW] Failed to cache CDN:', url))
            )
          );
        })
        .catch(err => {
          console.error('[SW] Failed to cache static assets:', err);
          throw err;
        });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Don't cache redirects (like login redirects)
          if (res.ok && !res.redirected && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline - try to serve from cache
          return caches.match(req).then(cached => {
            if (cached) {
              console.log('[SW] Serving from cache (offline):', req.url);
              return cached;
            }
            
            // Fallback for collector routes
            if (url.pathname.includes('/collector/')) {
              if (url.pathname.includes('readings/new')) {
                return caches.match('/collector/readings/new');
              }
              if (url.pathname.includes('my-subscribers')) {
                return caches.match('/collector/my-subscribers');
              }
              if (url.pathname.includes('sync')) {
                return caches.match('/collector/sync');
              }
            }
            
            // No cache found
            return new Response(
              '<h1 style="text-align:center;font-family:Arial;margin-top:50px;">⚠️ غير متصل بالإنترنت</h1><p style="text-align:center;">هذه الصفحة غير متاحة في وضع عدم الاتصال</p>',
              { 
                status: 503, 
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle all other requests (CSS, JS, images, API calls)
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Serve from cache immediately
        console.log('[SW] Serving from cache:', req.url);
        return cached;
      }

      // Not in cache - fetch from network
      return fetch(req)
        .then(res => {
          // Only cache successful responses
          if (res.status === 200 && (url.origin === location.origin || CDN_ASSETS.includes(req.url))) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => {
              c.put(req, copy).catch(err => 
                console.warn('[SW] Failed to cache:', req.url, err.message)
              );
            });
          }
          return res;
        })
        .catch(err => {
          console.log('[SW] Fetch failed (offline):', req.url);
          
          // Return empty response for failed assets
          return new Response('', { 
            status: 408, 
            statusText: 'Request Timeout / Offline' 
          });
        });
    })
  );
});

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
