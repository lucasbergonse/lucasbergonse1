
const CACHE_NAME = 'nova-pro-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/metadata.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/components/ContextSidebar.tsx',
  '/components/Header.tsx',
  '/components/InstallPrompt.tsx',
  '/components/TranscriptionList.tsx',
  '/components/VoiceOrb.tsx',
  '/hooks/useAudio.ts',
  '/hooks/useGemini.ts',
  '/hooks/useScreen.ts',
  '/utils/audio-utils.ts',
  '/utils/constants.ts',
  '/utils/file-helpers.ts',
  '/utils/memory-db.ts',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For TS/TSX files, fetch from network but override the MIME type.
  // This is the crucial fix for the in-browser Babel setup when the local server
  // doesn't provide the correct 'Content-Type' header.
  if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (!response.ok) {
          return response;
        }
        
        // Create new headers and set the correct Content-Type.
        const headers = new Headers(response.headers);
        headers.set('Content-Type', 'application/javascript');
        
        // Return a new response with the original body but modified headers.
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
      }).catch(error => {
        console.error('Fetch failed for TS/TSX file:', url.pathname, error);
        return new Response(`// Fetch failed for ${url.pathname}`, { status: 500 });
      })
    );
  } else {
    // For all other requests (HTML, CSS, images, etc.), use a cache-first strategy.
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          // Not in cache - fetch from network and cache it
          return fetch(event.request).then(
            networkResponse => {
              if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            }
          );
        }
      )
    );
  }
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
