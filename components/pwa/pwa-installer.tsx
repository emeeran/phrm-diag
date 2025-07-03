'use client'

import { useEffect } from 'react'

export function PWAInstaller() {
  // State to track installation status
  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}
