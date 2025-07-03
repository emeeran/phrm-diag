'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'

export function WebPushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default')
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setSupported(false)
      return
    }

    // Check current permission status
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    setLoading(true)
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        // Register the service worker for push notifications if permission is granted
        await registerServiceWorker()
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    } finally {
      setLoading(false)
    }
  }

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.ready
        
        // Subscribe to push notifications
        const options = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // This would be your VAPID public key from your server
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          )
        }
        
        const subscription = await registration.pushManager.subscribe(options)
        
        // Send the subscription to your server
        await saveSubscription(subscription)
        
        // Show a test notification
        showTestNotification()
      } catch (error) {
        console.error('Failed to register service worker or subscribe to push:', error)
      }
    }
  }

  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save push subscription on server')
      }
    } catch (error) {
      console.error('Error saving push subscription:', error)
    }
  }

  const showTestNotification = () => {
    if (permission === 'granted') {
      const notification = new Notification('PHRM Notifications Enabled', {
        body: 'You will now receive important health updates and reminders.',
        icon: '/icons/icon-192x192.png',
      })
      
      notification.onclick = function() {
        window.focus()
        notification.close()
      }
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  if (!supported) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        Push notifications are not supported in your browser
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {permission === 'granted' ? (
        <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-4 rounded-lg">
          <Bell className="h-5 w-5" />
          <span>Push notifications are enabled</span>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2 text-sm">
            <BellOff className="h-5 w-5 text-gray-400" />
            <span>Push notifications are {permission === 'denied' ? 'blocked' : 'not enabled'}</span>
          </div>
          
          {permission === 'denied' ? (
            <p className="text-sm text-amber-700 bg-amber-50 p-4 rounded-lg">
              You have blocked notifications. Please enable them in your browser settings to receive important health updates.
            </p>
          ) : (
            <Button
              onClick={requestPermission}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Requesting...' : 'Enable Push Notifications'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
