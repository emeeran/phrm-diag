'use client'

import { useOfflineStatus } from '@/hooks/use-offline'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react'

export function OfflineStatus() {
  const { isOnline, isSyncing, pendingSyncCount } = useOfflineStatus()

  if (isOnline && pendingSyncCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="flex items-center gap-4">
          <WifiOff className="h-4 w-4" />
          <div>
            <AlertTitle>You are offline</AlertTitle>
            <AlertDescription>
              Changes will be saved locally and synced when you reconnect.
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {isOnline && pendingSyncCount > 0 && (
        <Alert variant="default" className="flex items-center gap-4 bg-amber-50 text-amber-800 border-amber-300">
          <Cloud className="h-4 w-4" />
          <div>
            <AlertTitle>Syncing data...</AlertTitle>
            <AlertDescription>
              {isSyncing 
                ? `Syncing ${pendingSyncCount} item${pendingSyncCount !== 1 ? 's' : ''}...` 
                : `${pendingSyncCount} item${pendingSyncCount !== 1 ? 's' : ''} pending sync`}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}
