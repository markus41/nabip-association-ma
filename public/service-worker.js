/**
 * NABIP AMS Progressive Web App Service Worker
 *
 * Establish robust offline capabilities to ensure reliable access across network conditions.
 * This service worker provides:
 * - Cache-first asset delivery for optimal performance
 * - Network-first API calls with offline fallback
 * - Background sync for failed requests
 * - Push notification support for member engagement
 *
 * Best for: Organizations requiring consistent member portal access across varying network conditions
 */

// Service Worker version for cache invalidation
const CACHE_VERSION = 'nabip-ams-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to precache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html', // Fallback page
];

// Maximum cache size to prevent storage bloat
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_API_CACHE_SIZE = 20;

/**
 * Install Event - Establish core asset caching for immediate offline capability
 * Precaches critical resources to support offline-first architecture
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker for sustainable offline access...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Precaching critical assets for optimal performance');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

/**
 * Activate Event - Streamline storage by removing outdated caches
 * Ensures clean state for improved performance across updates
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new service worker version...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
            .map((cacheName) => {
              console.log('[Service Worker] Removing outdated cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control of all pages
  );
});

/**
 * Fetch Event - Establish intelligent caching strategy for optimal data delivery
 *
 * Strategy Selection:
 * - Static assets: Cache-first (performance priority)
 * - API calls: Network-first with cache fallback (data freshness priority)
 * - Navigation: Network-first with offline fallback page
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.includes('/api/') || url.pathname.includes('supabase')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Handle navigation requests with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-First Strategy - Deliver assets from cache for immediate response
 * Falls back to network if cache miss, then updates cache for future requests
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses for future offline access
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    throw error;
  }
}

/**
 * Network-First Strategy - Prioritize fresh data while maintaining offline capability
 * Ensures users receive latest information when online, with cached fallback
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful API responses with expiration
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_API_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Cache Size Management - Prevent storage bloat by limiting cache entries
 * Removes oldest entries when size limit exceeded
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    const deleteCount = keys.length - maxSize;
    const keysToDelete = keys.slice(0, deleteCount);

    await Promise.all(
      keysToDelete.map((key) => cache.delete(key))
    );
  }
}

/**
 * Background Sync - Queue failed requests for retry when connection restored
 * Ensures data integrity across network interruptions
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Process Sync Queue - Retry failed requests from IndexedDB queue
 * Maintains reliable data synchronization across offline periods
 */
async function processSyncQueue() {
  try {
    // IndexedDB access will be handled by client-side sync queue manager
    const clients = await self.clients.matchAll();

    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_QUEUE_PROCESS',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync queue processing failed:', error);
  }
}

/**
 * Push Notification Handler - Deliver timely member engagement notifications
 * Supports event reminders, renewal notices, and important updates
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'NABIP AMS',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
      };
    } catch (error) {
      console.error('[Service Worker] Failed to parse push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag || 'default',
      requireInteraction: notificationData.requireInteraction || false,
      data: notificationData.data,
      actions: notificationData.actions || [],
    })
  );
});

/**
 * Notification Click Handler - Navigate users to relevant content
 * Streamlines member workflow by deep-linking to notification context
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if no match found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message Handler - Enable bidirectional communication with client
 * Supports cache management commands and sync triggers
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(
      self.registration.sync.register('sync-queue')
    );
  }
});

console.log('[Service Worker] Service worker script loaded successfully');
