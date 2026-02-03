const CACHE_NAME = 'abyss-walker-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/styles.css',
    '/src/game.js',
    '/src/map-generator.js',
    '/src/player.js',
    'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
            .then(response => response || fetch(e.request))
    );
});
