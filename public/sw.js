// Sudoku Prime PWA Service Worker
// Enhanced with Workbox-style caching strategies, offline fallback, and update notifications

const CACHE_VERSION = 'sudoku-prime-v2';
const STATIC_CACHE = `sudoku-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `sudoku-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `sudoku-images-${CACHE_VERSION}`;
const FONT_CACHE = `sudoku-fonts-${CACHE_VERSION}`;

// Maximum entries for dynamic cache to prevent unbounded growth
const DYNAMIC_CACHE_MAX = 100;
const IMAGE_CACHE_MAX = 60;

// Core assets to pre-cache on install (these are the minimum for offline shell)
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/logo.svg',
  '/offline.html',
];

// ========== INSTALL EVENT ==========
// Pre-cache static assets and skip waiting for immediate activation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static shell assets');
        // Use addAll with error tolerance — don't fail if some assets are missing
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Some pre-cache assets failed:', err);
          // Still succeed — we'll cache them on first fetch
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ========== ACTIVATE EVENT ==========
// Clean up old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v2...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, FONT_CACHE];
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Notify all clients that the SW has been updated
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
          });
        });
      })
  );
});

// ========== CACHE LIMITATION ==========
// Trim caches to prevent unbounded growth (LRU-style)
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    // Delete oldest entries (first in = first out)
    const deleteCount = keys.length - maxEntries;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[SW] Trimmed ${deleteCount} entries from ${cacheName}`);
  }
}

// ========== FETCH EVENT ==========
// Route requests to appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Skip Supabase / API calls that should not be cached (auth, realtime)
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    // Network-only for API calls — let them fail naturally when offline
    return;
  }

  // ========== STRATEGY 1: Cache-First for Static Assets ==========
  // _next/static/ contains hashed JS/CSS bundles that never change
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ========== STRATEGY 2: Cache-First for Fonts ==========
  if (url.pathname.endsWith('.woff2') || url.pathname.endsWith('.woff') || url.pathname.endsWith('.ttf')) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // ========== STRATEGY 3: Cache-First for Images ==========
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.startsWith('/icon-')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    // Trim image cache periodically
    event.waitUntil(trimCache(IMAGE_CACHE, IMAGE_CACHE_MAX));
    return;
  }

  // ========== STRATEGY 4: Stale-While-Revalidate for CSS/JS ==========
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // ========== STRATEGY 5: Network-First for Navigation (HTML) ==========
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ========== STRATEGY 6: Stale-While-Revalidate for everything else ==========
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ========== CACHING STRATEGY IMPLEMENTATIONS ==========

/**
 * Cache-First: Try cache, fallback to network, cache the network response
 * Best for: Static assets with hashed filenames (never change)
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Cache-first fetch failed:', request.url, error);
    return new Response('', { status: 408, statusText: 'Offline - asset not cached' });
  }
}

/**
 * Stale-While-Revalidate: Return cached immediately, then update cache from network
 * Best for: CSS, JS, non-critical resources where freshness matters but speed is priority
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached || new Response('', { status: 408, statusText: 'Offline' }));

  return cached || fetchPromise;
}

/**
 * Network-First with Offline Fallback: Try network, fallback to cache, then offline page
 * Best for: Navigation requests (HTML pages) — always want fresh content if available
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache the successful response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      // Trim dynamic cache
      await trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_MAX);
    }
    return response;
  } catch (error) {
    // Network failed — try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // No cache — try the root page (app shell)
    const rootCached = await caches.match('/');
    if (rootCached) {
      return rootCached;
    }
    // Last resort — offline fallback page
    const offlineCached = await caches.match('/offline.html');
    if (offlineCached) {
      return offlineCached;
    }
    // Absolute fallback
    return new Response(
      `<html><body style="background:#0d1117;color:#06b6d4;text-align:center;padding-top:40vh;font-family:system-ui">
        <h1>🧩 Sudoku Prime</h1>
        <p>You're offline and this page isn't cached yet.</p>
        <p>Please connect to the internet and try again.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 200 }
    );
  }
}

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name)));
    });
  }
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.source.postMessage({ type: 'CACHE_SIZE', size });
    });
  }
});

// ========== CACHE SIZE UTILITY ==========
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  return totalSize;
}

// ========== PUSH NOTIFICATION SUPPORT (future) ==========
self.addEventListener('push', (event) => {
  // Placeholder for future push notification support
  console.log('[SW] Push notification received:', event.data?.text());
});
