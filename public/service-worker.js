const CACHE_NAME = 'police-system-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/abordagem.html',
  '/busca.html',
  '/assets/main.js',
  '/styles/main.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://code.getmdl.io/1.3.0/material.indigo-pink.min.css',
  'https://code.getmdl.io/1.3.0/material.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
}); 