'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TouchCarousel } from '@/components/mobile/touch-carousel'
import { VoiceInput } from '@/components/mobile/voice-input'
import { CameraCapture } from '@/components/mobile/camera-capture'
import { useSwipe } from '@/hooks/use-swipe'
import { useOfflineStatus } from '@/hooks/use-offline'
import { Smartphone, Gesture, Mic, Camera, PanelRight, Settings, ArrowLeft } from 'lucide-react'

export default function MobileFeatureDemoPage() {
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const { isOnline, pendingSyncCount } = useOfflineStatus()
  
  // Reset demo state if tab changes
  useEffect(() => {
    setShowCamera(false)
    setCapturedImage(null)
    setTranscript('')
  }, [activeTab])
  
  // Swipe gesture handlers
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => setActiveTab(prev => Math.min(prev + 1, 3)),
    onSwipeRight: () => setActiveTab(prev => Math.max(prev - 1, 0)),
  })
  
  // Handle camera capture
  const handleCapture = (image: string) => {
    setCapturedImage(image)
    setShowCamera(false)
  }
  
  // The demo cards for each feature
  const featureCards = [
    // PWA Features
    <Card key="pwa" className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <CardTitle>PWA Features</CardTitle>
        </div>
        <CardDescription>Progressive Web App capabilities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-medium">Online Status</h3>
          <div className={`px-4 py-2 rounded-md ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        
        {pendingSyncCount > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Pending Sync</h3>
            <div className="px-4 py-2 rounded-md bg-amber-50 text-amber-700">
              {pendingSyncCount} item(s) waiting to sync
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="font-medium">Installation</h3>
          <p className="text-sm text-gray-500">
            You can install this app on your device for offline access.
          </p>
          <Button variant="outline" className="w-full">
            Add to Home Screen
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Settings</h3>
          <Link href="/dashboard/mobile/settings">
            <Button className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Mobile Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>,
    
    // Touch & Gestures
    <Card key="gestures" className="h-full" {...swipeHandlers}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Gesture className="h-5 w-5 text-blue-600" />
          <CardTitle>Touch & Gestures</CardTitle>
        </div>
        <CardDescription>
          Swipe left/right to navigate between cards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 text-blue-700 p-4 rounded-md text-center">
          <p>← Swipe to navigate →</p>
          <p className="text-sm mt-2">Try swiping this card horizontally</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Current Card</h3>
          <div className="px-4 py-2 rounded-md bg-gray-100">
            Card {activeTab + 1} of 4
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((idx) => (
            <Button
              key={idx}
              variant={activeTab === idx ? "default" : "outline"}
              className="h-8 p-0"
              onClick={() => setActiveTab(idx)}
            >
              {idx + 1}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>,
    
    // Voice Input
    <Card key="voice" className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Mic className="h-5 w-5 text-blue-600" />
          <CardTitle>Voice Input</CardTitle>
        </div>
        <CardDescription>Speak to enter text</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <VoiceInput
          onTranscript={(text) => setTranscript(text)}
          placeholder="Start speaking"
        />
        
        {transcript && (
          <div className="space-y-2">
            <h3 className="font-medium">Your Speech</h3>
            <div className="px-4 py-2 rounded-md bg-gray-100">
              {transcript}
            </div>
          </div>
        )}
      </CardContent>
    </Card>,
    
    // Camera
    <Card key="camera" className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Camera className="h-5 w-5 text-blue-600" />
          <CardTitle>Camera Integration</CardTitle>
        </div>
        <CardDescription>Capture images directly in the app</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showCamera ? (
          <CameraCapture
            onCapture={handleCapture}
            onCancel={() => setShowCamera(false)}
          />
        ) : (
          <>
            {capturedImage ? (
              <div className="space-y-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-md"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCapturedImage(null)}
                  >
                    Clear Image
                  </Button>
                  <Button onClick={() => setShowCamera(true)}>
                    New Photo
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => setShowCamera(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Open Camera
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  ]
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Mobile Features</h1>
          <p className="text-sm text-gray-500">
            Demo of PWA and mobile-optimized features
          </p>
        </div>
      </div>
      
      <div className="h-[500px]">
        <TouchCarousel items={featureCards} />
      </div>
      
      <Link href="/dashboard/records/new/mobile">
        <Button className="w-full">
          <PanelRight className="h-4 w-4 mr-2" />
          Try Mobile Record Form
        </Button>
      </Link>
    </div>
  )
}
