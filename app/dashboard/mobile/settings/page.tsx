'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WebPushNotifications } from '@/components/mobile/web-push-notifications'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type NotificationPreference = {
  key: string
  label: string
  description: string
  enabled: boolean
}

export default function MobileSettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      key: 'medication_reminders',
      label: 'Medication Reminders',
      description: 'Receive reminders when it\'s time to take your medications',
      enabled: true
    },
    {
      key: 'appointment_reminders',
      label: 'Appointment Reminders',
      description: 'Get notified about upcoming medical appointments',
      enabled: true
    },
    {
      key: 'family_updates',
      label: 'Family Updates',
      description: 'Receive notifications when family members update their health records',
      enabled: true
    },
    {
      key: 'health_insights',
      label: 'Health Insights',
      description: 'Get AI-powered health insights based on your records',
      enabled: true
    },
    {
      key: 'emergency_alerts',
      label: 'Emergency Alerts',
      description: 'High-priority alerts for urgent family health situations',
      enabled: true
    }
  ])

  const togglePreference = (key: string) => {
    setPreferences(preferences.map(pref => 
      pref.key === key ? { ...pref, enabled: !pref.enabled } : pref
    ))
  }

  const savePreferences = async () => {
    setSaving(true)
    
    try {
      // In a real app, we would send these preferences to the server
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate success
      console.log('Preferences saved:', preferences)
      router.refresh()
    } catch (error) {
      console.error('Error saving notification preferences:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const clearLocalData = () => {
    if (typeof window !== 'undefined' && window.confirm('This will clear all locally cached data. Continue?')) {
      // Clear IndexedDB
      const request = indexedDB.deleteDatabase('phrm-offline')
      request.onsuccess = () => {
        console.log('IndexedDB database deleted successfully')
      }
      request.onerror = () => {
        console.error('Error deleting IndexedDB database')
      }
      
      // Clear local storage
      localStorage.clear()
      
      // Clear service worker caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName)
          })
        })
      }
      
      // Reload the page
      window.location.reload()
    }
  }

  return (
    <div className="container py-6 space-y-8">
      <h1 className="text-2xl font-bold">Mobile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <WebPushNotifications />
          
          <div className="space-y-6 pt-4">
            <h3 className="font-medium">Notification Preferences</h3>
            
            <div className="space-y-4">
              {preferences.map(pref => (
                <div key={pref.key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={pref.key} className="font-medium">
                      {pref.label}
                    </Label>
                    <p className="text-sm text-gray-500">{pref.description}</p>
                  </div>
                  <Switch
                    id={pref.key}
                    checked={pref.enabled}
                    onCheckedChange={() => togglePreference(pref.key)}
                  />
                </div>
              ))}
            </div>
            
            <Button 
              onClick={savePreferences}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Saving...
                </>
              ) : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Offline Data</CardTitle>
          <CardDescription>Manage locally stored data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              Your health records are saved locally for offline access. You can clear this data if needed.
            </p>
            <Button 
              variant="destructive" 
              onClick={clearLocalData}
            >
              Clear Local Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
