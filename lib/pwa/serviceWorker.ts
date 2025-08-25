/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Types
interface QueuedMessage {
  id: string;
  sessionId: string;
  content: string;
  timestamp: number;
  modelId?: string;
  attachments?: File[];
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number;
}

interface OfflineQueueItem {
  url: string;
  method: string;
  body?: any;
  headers?: { [key: string]: string };
  timestamp: number;
}

// Constants
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAMES = {
  STATIC: `exprezzzo-static-${CACHE_VERSION}`,
  DYNAMIC: `exprezzzo-dynamic-${CACHE_VERSION}`,
  API: `exprezzzo-api-${CACHE_VERSION}`,
  IMAGES: `exprezzzo-images-${CACHE_VERSION}`,
  FONTS: `exprezzzo-fonts-${CACHE_VERSION}`,
  SESSIONS: `exprezzzo-sessions-${CACHE_VERSION}`,
  MODELS: `exprezzzo-models-${CACHE_VERSION}`
};

const OFFLINE_FALLBACKS = {
  '/playground': '/offline-playground.html',
  '/sessions': '/offline-sessions.html',
  '/projects': '/offline-projects.html'
};

// Background sync queues
const messageQueue = new Queue('message-queue', {
  onSync: async ({ queue }) => {
    console.log('Processing message queue...');
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await processQueuedMessage(entry);
      } catch (error) {
        console.error('Failed to process queued message:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

const sessionQueue = new Queue('session-queue', {
  onSync: async ({ queue }) => {
    console.log('Processing session queue...');
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        console.error('Failed to sync session:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// Precache and cleanup
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// Cache strategies

// Static assets (JS, CSS, images)
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true
      })
    ]
  })
);

// Fonts
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: CACHE_NAMES.FONTS,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true
      })
    ]
  })
);

// API responses with different strategies
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/sessions'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.SESSIONS,
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        purgeOnQuotaError: true
      }),
      new BackgroundSyncPlugin('session-queue', {
        maxRetentionTime: 24 * 60 // 24 hours
      })
    ]
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/models'),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.MODELS,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
        purgeOnQuotaError: true
      })
    ]
  })
);

// Chat API - Network only for real-time responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/chat'),
  new NetworkOnly({
    plugins: [
      new BackgroundSyncPlugin('message-queue', {
        maxRetentionTime: 24 * 60 // 24 hours
      })
    ]
  })
);

// Images with long cache
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.IMAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true
      })
    ]
  })
);

// Navigation fallback
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: CACHE_NAMES.DYNAMIC,
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
          purgeOnQuotaError: true
        })
      ]
    }),
    {
      denylist: [/^\/_/, /\/api\//]
    }
  )
);

// Message processing functions
async function processQueuedMessage(entry: any) {
  const request = entry.request.clone();
  const body = await request.json();
  
  const queuedMessage: QueuedMessage = {
    ...body,
    retryCount: (body.retryCount || 0) + 1,
    timestamp: Date.now()
  };

  // Implement exponential backoff
  const delay = Math.min(1000 * Math.pow(2, queuedMessage.retryCount), 30000);
  await new Promise(resolve => setTimeout(resolve, delay));

  // Send to API
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Offline-Queue': 'true'
    },
    body: JSON.stringify(queuedMessage)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Broadcast success to clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'OFFLINE_MESSAGE_SENT',
      messageId: queuedMessage.id,
      response: response.body
    });
  });
}

// Advanced caching utilities
class SmartCache {
  private cacheName: string;
  private defaultTTL: number;

  constructor(cacheName: string, defaultTTL: number = 3600000) { // 1 hour default
    this.cacheName = cacheName;
    this.defaultTTL = defaultTTL;
  }

  async get(key: string): Promise<any | null> {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(key);
    
    if (!response) return null;

    try {
      const cachedData: CachedResponse = await response.json();
      
      // Check if expired
      if (Date.now() > cachedData.timestamp + cachedData.ttl) {
        await cache.delete(key);
        return null;
      }
      
      return cachedData.data;
    } catch {
      await cache.delete(key);
      return null;
    }
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    const cache = await caches.open(this.cacheName);
    
    const cachedResponse: CachedResponse = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    const response = new Response(JSON.stringify(cachedResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

    await cache.put(key, response);
  }

  async delete(key: string): Promise<boolean> {
    const cache = await caches.open(this.cacheName);
    return await cache.delete(key);
  }

  async clear(): Promise<void> {
    await caches.delete(this.cacheName);
  }
}

// Smart cache instances
const sessionCache = new SmartCache('smart-sessions', 24 * 60 * 60 * 1000); // 24 hours
const modelCache = new SmartCache('smart-models', 60 * 60 * 1000); // 1 hour

// Event listeners
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  
  event.waitUntil((async () => {
    // Clean up old caches
    const cacheNames = await caches.keys();
    const oldCacheNames = cacheNames.filter(name => 
      name.startsWith('exprezzzo-') && !Object.values(CACHE_NAMES).includes(name)
    );
    
    await Promise.all(oldCacheNames.map(name => caches.delete(name)));
    
    // Take control of all clients
    await self.clients.claim();
    
    console.log('Service worker activated');
  })());
});

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CACHE_SESSION':
      await sessionCache.set(`session-${payload.id}`, payload, 24 * 60 * 60 * 1000);
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'GET_CACHED_SESSION':
      const session = await sessionCache.get(`session-${payload.id}`);
      event.ports[0].postMessage({ session });
      break;
      
    case 'CLEAR_CACHE':
      await Promise.all([
        sessionCache.clear(),
        modelCache.clear(),
        caches.delete(CACHE_NAMES.DYNAMIC)
      ]);
      event.ports[0].postMessage({ success: true });
      break;
      
    case 'QUEUE_MESSAGE':
      await messageQueue.pushRequest({ 
        request: new Request('/api/chat', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      });
      event.ports[0].postMessage({ queued: true });
      break;
      
    case 'GET_CACHE_STATUS':
      const cacheStatus = await getCacheStatus();
      event.ports[0].postMessage(cacheStatus);
      break;
  }
});

// Network status handling
self.addEventListener('online', () => {
  console.log('Network back online - processing queued requests');
  // Background sync will automatically trigger
});

self.addEventListener('offline', () => {
  console.log('Network offline - queueing requests');
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const notificationOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'general',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Default action or 'open' action
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      // Try to focus existing client
      const client = clients.find(c => c.visibilityState === 'visible');
      if (client) {
        client.focus();
        client.postMessage({ type: 'NOTIFICATION_CLICK', data });
      } else {
        // Open new window
        self.clients.openWindow(data.url || '/playground');
      }
    })
  );
});

// Fetch event with smart fallbacks
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle navigation requests with offline fallbacks
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Check if we have a specific offline fallback
          const fallbackPath = Object.keys(OFFLINE_FALLBACKS).find(path => 
            url.pathname.startsWith(path)
          );
          
          if (fallbackPath) {
            return caches.match(OFFLINE_FALLBACKS[fallbackPath]);
          }
          
          // Default offline page
          return caches.match('/offline.html');
        })
    );
    return;
  }
  
  // Handle API requests with smart caching
  if (url.pathname.startsWith('/api/')) {
    // Already handled by registerRoute above
    return;
  }
});

// Utility functions
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const cacheStats = await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      return { name, count: keys.length };
    })
  );
  
  return {
    version: CACHE_VERSION,
    caches: cacheStats,
    isOnline: navigator.onLine
  };
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Check each cached response for expiration
      for (const request of requests) {
        try {
          const response = await cache.match(request);
          if (response) {
            const cachedData = await response.json();
            if (cachedData.timestamp && cachedData.ttl) {
              if (Date.now() > cachedData.timestamp + cachedData.ttl) {
                await cache.delete(request);
              }
            }
          }
        } catch {
          // If parsing fails, delete the entry
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour

console.log('Exprezzzo Service Worker initialized');

// Export for TypeScript
export {};