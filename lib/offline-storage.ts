'use client'

const DB_NAME = 'phrm-offline'
const DB_VERSION = 1

// Store names for different types of data
const STORES = {
  HEALTH_RECORDS: 'health-records',
  MEDICATIONS: 'medications',
  APPOINTMENTS: 'appointments',
  SYNC_QUEUE: 'sync-queue',
}

// Open the database and create object stores if needed
export const openDB = async () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error('Error opening IndexedDB', event)
      reject(new Error('Could not open IndexedDB'))
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    // This will run if the database doesn't exist or needs an update
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores with auto-incrementing keys if they don't exist
      if (!db.objectStoreNames.contains(STORES.HEALTH_RECORDS)) {
        db.createObjectStore(STORES.HEALTH_RECORDS, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(STORES.MEDICATIONS)) {
        db.createObjectStore(STORES.MEDICATIONS, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
        db.createObjectStore(STORES.APPOINTMENTS, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
        syncStore.createIndex('createdAt', 'createdAt', { unique: false })
        syncStore.createIndex('type', 'type', { unique: false })
      }
    }
  })
}

// Generic function to add an item to a store
export const addItem = async <T extends { id: string }>(
  storeName: string,
  item: T
): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onerror = (event) => {
      console.error(`Error adding item to ${storeName}`, event)
      reject(new Error(`Failed to add item to ${storeName}`))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

// Generic function to get an item from a store by id
export const getItem = async <T>(
  storeName: string,
  id: string
): Promise<T | undefined> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onerror = (event) => {
      console.error(`Error getting item from ${storeName}`, event)
      reject(new Error(`Failed to get item from ${storeName}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

// Generic function to get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = (event) => {
      console.error(`Error getting items from ${storeName}`, event)
      reject(new Error(`Failed to get items from ${storeName}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

// Generic function to delete an item from a store by id
export const deleteItem = async (
  storeName: string,
  id: string
): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onerror = (event) => {
      console.error(`Error deleting item from ${storeName}`, event)
      reject(new Error(`Failed to delete item from ${storeName}`))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

// Add an item to the sync queue when offline
export const addToSyncQueue = async (
  type: string,
  data: any,
  action: 'create' | 'update' | 'delete'
): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    const request = store.add({
      type,
      data,
      action,
      createdAt: new Date().toISOString(),
      attempts: 0,
    })

    request.onerror = (event) => {
      console.error('Error adding item to sync queue', event)
      reject(new Error('Failed to add item to sync queue'))
    }

    request.onsuccess = () => {
      // Request background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((sw) => {
          sw.sync.register('sync-data')
            .catch(err => console.error('Background sync registration failed:', err))
        })
      }
      resolve()
    }
  })
}

// Get items from the sync queue
export const getSyncQueue = async (): Promise<any[]> => {
  return getAllItems(STORES.SYNC_QUEUE)
}

// Remove an item from the sync queue
export const removeFromSyncQueue = async (id: number): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    const request = store.delete(id)

    request.onerror = (event) => {
      console.error('Error removing item from sync queue', event)
      reject(new Error('Failed to remove item from sync queue'))
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

// Helper functions for specific stores
export const addHealthRecord = async (record: any) => {
  await addItem(STORES.HEALTH_RECORDS, record)
}

export const getHealthRecord = async (id: string) => {
  return getItem(STORES.HEALTH_RECORDS, id)
}

export const getAllHealthRecords = async () => {
  return getAllItems(STORES.HEALTH_RECORDS)
}

export const deleteHealthRecord = async (id: string) => {
  await deleteItem(STORES.HEALTH_RECORDS, id)
}

// Check if user is online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Sync handler for offline data
export const syncOfflineData = async (): Promise<void> => {
  if (!isOnline()) {
    console.log('Still offline, will sync later')
    return
  }

  const queue = await getSyncQueue()
  console.log(`Syncing ${queue.length} items from queue`)

  for (const item of queue) {
    try {
      let endpoint = ''
      let method = 'POST'

      switch (item.type) {
        case 'health-record':
          endpoint = '/api/health-record'
          break
        case 'medication':
          endpoint = '/api/medication'
          break
        case 'appointment':
          endpoint = '/api/appointment'
          break
        default:
          console.warn(`Unknown sync type: ${item.type}`)
          continue
      }

      if (item.action === 'update') {
        method = 'PUT'
        if (item.data.id) {
          endpoint += `/${item.data.id}`
        }
      } else if (item.action === 'delete') {
        method = 'DELETE'
        endpoint += `/${item.data.id}`
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data),
      })

      if (response.ok) {
        console.log(`Successfully synced item ${item.id}`)
        await removeFromSyncQueue(item.id)
      } else {
        console.error(`Failed to sync item ${item.id}`, await response.text())
        // Increment attempt count or handle persistent failures
      }
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error)
    }
  }
}

// Register event listeners for online/offline status
export const registerNetworkListeners = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    console.log('Back online, syncing data...')
    syncOfflineData()
  })

  window.addEventListener('offline', () => {
    console.log('Gone offline, will save data locally')
    // Could show a notification to the user here
  })
}
