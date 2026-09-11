const CACHE_NAME = 'conecta2chat-v1';

// Archivos base de la app (ajusta rutas si cambian nombres)
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/js/app.js',
  '/js/config.js',
  '/manifest.json'
];

// Instalación: precachea el shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activación: borra caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first con actualización en segundo plano, solo para GET del mismo origen.
// Las peticiones a Supabase (otro origen) o que no sean GET pasan directo a la red.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
