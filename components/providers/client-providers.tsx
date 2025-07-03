'use client'

import { OfflineStatus } from '@/components/offline-status'
import { InstallPWA } from '@/components/pwa/install-pwa'
import { BottomNavigation } from '@/components/mobile/bottom-navigation'
import { useEffect } from 'react'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register the network listeners
    const registerListeners = async () => {
      const { registerNetworkListeners } = await import('@/lib/offline-storage')
      registerNetworkListeners()
    }
    
    registerListeners()
  }, [])

  return (
    <>
      {children}
      <OfflineStatus />
      <InstallPWA />
      <BottomNavigation />
    </>
  )
}
