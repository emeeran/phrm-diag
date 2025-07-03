'use client'

import { useState, useEffect } from 'react'
import * as offlineStorage from '@/lib/offline-storage'

// Type for offline state
type OfflineState = {
  isOnline: boolean
  isSyncing: boolean
  pendingSyncCount: number
}

// Hook to manage online/offline state
export function useOfflineStatus() {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: true,
    isSyncing: false,
    pendingSyncCount: 0
  })

  useEffect(() => {
    // Set initial state
    setOfflineState(prev => ({
      ...prev,
      isOnline: offlineStorage.isOnline()
    }))

    // Check for pending syncs
    const checkSyncQueue = async () => {
      try {
        const queue = await offlineStorage.getSyncQueue()
        setOfflineState(prev => ({
          ...prev,
          pendingSyncCount: queue.length
        }))
      } catch (error) {
        console.error('Error checking sync queue:', error)
      }
    }

    checkSyncQueue()

    // Network status change handlers
    const handleOnline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: true }))
      triggerSync()
    }

    const handleOffline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: false }))
    }

    // Sync handler
    const triggerSync = async () => {
      if (offlineState.isOnline && !offlineState.isSyncing) {
        try {
          setOfflineState(prev => ({ ...prev, isSyncing: true }))
          await offlineStorage.syncOfflineData()
          const queue = await offlineStorage.getSyncQueue()
          setOfflineState({
            isOnline: true,
            isSyncing: false,
            pendingSyncCount: queue.length
          })
        } catch (error) {
          console.error('Error syncing data:', error)
          setOfflineState(prev => ({ ...prev, isSyncing: false }))
        }
      }
    }

    // Register event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register for service worker sync events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('sync', () => {
          checkSyncQueue()
        })
      })
    }

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [offlineState.isOnline, offlineState.isSyncing])

  return offlineState
}

// Hook for using offline-capable data fetching
export function useOfflineData<T>(
  storeName: string,
  fetchFn: () => Promise<T[]>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { isOnline } = useOfflineStatus()

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // If online, fetch from server and update local cache
        if (isOnline) {
          const fetchedData = await fetchFn()
          if (isMounted) {
            setData(fetchedData)
            
            // Update the offline cache
            for (const item of fetchedData) {
              // @ts-ignore - we know these items have an id
              await offlineStorage.addItem(storeName, item)
            }
          }
        } else {
          // If offline, load from cache
          const cachedData = await offlineStorage.getAllItems<T>(storeName)
          if (isMounted) {
            setData(cachedData)
          }
        }
      } catch (err) {
        console.error(`Error loading data for ${storeName}:`, err)
        if (isMounted) {
          setError(err as Error)
          
          // Try to get cached data even if the fetch failed
          try {
            const cachedData = await offlineStorage.getAllItems<T>(storeName)
            if (isMounted) {
              setData(cachedData)
            }
          } catch (cacheErr) {
            console.error(`Error loading cached data for ${storeName}:`, cacheErr)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeName, isOnline, ...dependencies])

  // Function to create/update items with offline support
  const saveItem = async (item: any, action: 'create' | 'update' = 'create') => {
    try {
      // Add to local storage immediately
      await offlineStorage.addItem(storeName, item)
      
      // Update local state
      setData(prev => {
        const index = prev.findIndex((i: any) => i.id === item.id)
        if (index >= 0) {
          return [...prev.slice(0, index), item, ...prev.slice(index + 1)]
        } else {
          return [...prev, item]
        }
      })

      // If online, send to server
      if (isOnline) {
        // Determine the endpoint and method based on the item type
        // This would be customized based on your API
        const endpoint = `/api/${storeName.replace('-', '/')}${action === 'update' ? `/${item.id}` : ''}`
        const method = action === 'create' ? 'POST' : 'PUT'

        await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        })
      } else {
        // If offline, add to sync queue
        await offlineStorage.addToSyncQueue(storeName.replace('-', '_'), item, action)
      }

      return true
    } catch (err) {
      console.error(`Error saving ${storeName} item:`, err)
      // Always add to local storage and queue for sync later
      try {
        await offlineStorage.addItem(storeName, item)
        await offlineStorage.addToSyncQueue(storeName.replace('-', '_'), item, action)
      } catch (storageErr) {
        console.error(`Failed to save offline: ${storageErr}`)
        return false
      }
      return false
    }
  }

  // Function to delete items with offline support
  const deleteItem = async (id: string) => {
    try {
      // Remove from local state
      setData(prev => prev.filter((item: any) => item.id !== id))
      
      // Delete from local storage
      await offlineStorage.deleteItem(storeName, id)

      // If online, delete from server
      if (isOnline) {
        const endpoint = `/api/${storeName.replace('-', '/')}/${id}`
        await fetch(endpoint, {
          method: 'DELETE',
        })
      } else {
        // If offline, add to sync queue
        await offlineStorage.addToSyncQueue(storeName.replace('-', '_'), { id }, 'delete')
      }

      return true
    } catch (err) {
      console.error(`Error deleting ${storeName} item:`, err)
      if (!isOnline) {
        // If offline, still try to queue the delete
        try {
          await offlineStorage.addToSyncQueue(storeName.replace('-', '_'), { id }, 'delete')
        } catch (queueErr) {
          console.error(`Failed to queue delete: ${queueErr}`)
        }
      }
      return false
    }
  }

  return { data, loading, error, saveItem, deleteItem }
}
