// This service worker can be customized
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules

import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'

// Claim clients so the service worker takes over the current page on activation
clientsClaim()

// Precache all static assets and HTML responses
// This is the compiled manifest at build time 
self.__WB_MANIFEST = self.__WB_MANIFEST || []
precacheAndRoute(self.__WB_MANIFEST)

// Setup app shell route
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$')
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html
  ({ request, url }) => {
    // If this is an image, font, or an API request, don't use the app shell
    if (
      request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.startsWith('/api/')
    ) {
      return false
    }
    // If this has a file extension, don't use the app shell
    if (url.pathname.match(fileExtensionRegexp)) {
      return false
    }
    // Return true to use the app shell for all other cases
    return true
  },
  createHandlerBoundToURL('/index.html')
)

// Cache images with a Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      // Don't cache more than 50 images, and expire them after 30 days
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
)

// Cache static assets (CSS, JS) with a Stale While Revalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
)

// Cache API responses with a Network First strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      // Don't cache more than 100 API responses, and expire them after 1 day
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  })
)

// Handle offline fallbacks
const FALLBACK_HTML_URL = '/offline.html'
const FALLBACK_IMAGE_URL = '/images/offline-image.png'

// Cache the offline page on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-cache').then((cache) => {
      return cache.addAll([
        FALLBACK_HTML_URL,
        // Add other offline essentials
      ]);
    })
  );
});

// Offline fallback for HTML
registerRoute(
  ({ request }) => request.destination === 'document',
  async ({ event }) => {
    try {
      return await new NetworkFirst().handle(event);
    } catch (error) {
      return caches.match(FALLBACK_HTML_URL);
    }
  }
);

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'health-record-sync') {
    event.waitUntil(syncHealthRecords());
  }
});

async function syncHealthRecords() {
  // Get all queued records
  const db = await openIndexedDB();
  const records = await getAllHealthRecordsFromDB(db);

  // Process each record
  for (const record of records) {
    try {
      // Try to send to server
      const response = await fetch('/api/health-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.data),
      });

      if (response.ok) {
        // If successful, remove from queue
        await deleteRecordFromDB(db, record.id);
      }
    } catch (err) {
      console.error('Failed to sync record:', err);
      // Keep in queue for next sync attempt
    }
  }
}

// IndexedDB helper functions
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('phrm-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('health-records')) {
        db.createObjectStore('health-records', { keyPath: 'id' });
      }
    };
  });
}

async function getAllHealthRecordsFromDB(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('health-records', 'readonly');
    const store = transaction.objectStore('health-records');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function deleteRecordFromDB(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('health-records', 'readwrite');
    const store = transaction.objectStore('health-records');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
