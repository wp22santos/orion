const CACHE_NAME = 'sispol-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/js/db.js',
    '/js/auth.js',
    '/js/backup.js',
    '/js/busca.js',
    '/js/abordagem.js',
    'https://unpkg.com/dexie@latest/dist/dexie.js',
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://code.getmdl.io/1.3.0/material.indigo-pink.min.css',
    'https://code.getmdl.io/1.3.0/material.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - retorna a resposta do cache
                if (response) {
                    return response;
                }

                // Clone da requisição
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    (response) => {
                        // Verifica se recebemos uma resposta válida
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone da resposta
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Não cachear requisições de API
                                if (!event.request.url.includes('/api/')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    }
                );
            })
            .catch(() => {
                // Fallback para recursos não encontrados
                if (event.request.url.includes('.html')) {
                    return caches.match('/offline.html');
                }
            })
    );
}); 