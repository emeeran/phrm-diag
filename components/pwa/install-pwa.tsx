'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Store the install prompt event for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallButton(true)
    }

    // Check if the app is already installed
    const checkAppInstalled = () => {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      ) {
        setIsInstalled(true)
      }
    }

    // When the app is successfully installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallButton(false)
      console.log('PWA was installed')
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    checkAppInstalled()

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Handle the installation
  const handleInstallClick = async () => {
    if (!installPrompt) return
    
    // Show the installation prompt
    installPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice
    
    // Reset the install prompt
    setInstallPrompt(null)
    setShowInstallButton(false)
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
  }

  // Show the install button only if the app is not installed and the browser supports installation
  if (!showInstallButton || isInstalled) return null

  return (
    <Button 
      onClick={handleInstallClick}
      variant="outline"
      className="flex items-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
        <polyline points="7.5 19.79 7.5 14.6 3 12" />
        <polyline points="21 12 16.5 14.6 16.5 19.79" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
      Install App
    </Button>
  )
}
