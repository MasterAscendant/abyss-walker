/**
 * Abyss Walker - Service Worker
 * Provides offline caching, background sync, and update handling
 */

const CACHE_NAME = 'abyss-walker-v1';
const STATIC_CACHE = 'abyss-walker-static-v1';
const DYNAMIC_CACHE = 'abyss-walker-dynamic-v1';
const IMAGE_CACHE = 'abyss-walker-images-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './game.js',
  './touch-controls.js',
  './fullscreen.js',
  './wakelock.js',
  './manifest.json',
  './assets/styles.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old versions of our caches
              return name.startsWith('abyss-walker-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && 
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isImage(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isAPI(request)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Background Sync for high scores
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-high-scores') {
    event.waitUntil(syncHighScores());
  } else if (event.tag === 'sync-game-state') {
    event.waitUntil(syncGameState());
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New challenge awaits in the Abyss!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    tag: data.tag || 'abyss-walker',
    requireInteraction: false,
    actions: [
      {
        action: 'play',
        title: 'Play Now'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Abyss Walker', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'play' || event.action === 'default') {
    event.waitUntil(
      clients.openWindow('./?action=continue')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_ASSETS') {
    cacheAssets(event.data.assets);
  } else if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

// Helper functions
function isImage(request) {
  return request.destination === 'image' || 
         /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(request.url);
}

function isStaticAsset(request) {
  return request.destination === 'script' || 
         request.destination === 'style' ||
         request.destination === 'document';
}

function isAPI(request) {
  return request.url.includes('/api/') || 
         request.url.includes('highscore') ||
         request.url.includes('leaderboard');
}

// Cache strategies
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline fallback for images
    if (isImage(request)) {
      return cache.match('./assets/placeholder.png');
    }
    throw err;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  return cached || fetchPromise;
}

// Background sync functions
async function syncHighScores() {
  const db = await openDB();
  const pendingScores = await db.getAll('pendingScores');
  
  for (const score of pendingScores) {
    try {
      const response = await fetch('/api/highscores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score)
      });
      
      if (response.ok) {
        await db.delete('pendingScores', score.id);
      }
    } catch (err) {
      console.error('[SW] Failed to sync score:', err);
    }
  }
}

async function syncGameState() {
  const db = await openDB();
  const gameState = await db.get('gameState', 'current');
  
  if (gameState) {
    try {
      await fetch('/api/gamestate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState)
      });
    } catch (err) {
      console.error('[SW] Failed to sync game state:', err);
    }
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AbyssWalkerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingScores')) {
        db.createObjectStore('pendingScores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('gameState')) {
        db.createObjectStore('gameState', { keyPath: 'id' });
      }
    };
  });
}

// Cache additional assets on demand
async function cacheAssets(assets) {
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const asset of assets) {
    try {
      const response = await fetch(asset);
      if (response.ok) {
        cache.put(asset, response);
      }
    } catch (err) {
      console.error('[SW] Failed to cache asset:', asset, err);
    }
  }
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('abyss-walker-'))
      .map(name => caches.delete(name))
  );
}