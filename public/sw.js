const CACHE_NAME = 'caf-gpm-cache-v6'; // Incrementando a versão novamente
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable_icon.png',
  '/favicon.ico',
  '/robots.txt',
  '/placeholder.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Garante que os arquivos essenciais sejam cacheados
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET, chamadas de API, ou esquemas não suportados (como chrome-extension)
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.protocol !== 'http:' && url.protocol !== 'https:' || url.hostname.includes('supabase.co')) {
    return;
  }
  
  // Estratégia Network First / Cache Fallback para os recursos permitidos
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseToCache = networkResponse.clone();

        if (networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          throw new Error('Failed to fetch resource from network or cache.');
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});