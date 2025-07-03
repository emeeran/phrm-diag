'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, Settings, Wrench, PanelRight, Map } from 'lucide-react'

export default function MobilePage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Mobile Features</h1>
      <p className="text-gray-500">
        PHRM-Diag now includes mobile-optimized features for a better experience on smartphones and tablets.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/mobile/features">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <CardTitle>Feature Demo</CardTitle>
              </div>
              <CardDescription>
                Try out all mobile-specific features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Explore PWA capabilities, offline mode, camera integration, voice input, and touch gestures.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/records/new/mobile">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <PanelRight className="h-5 w-5 text-green-600" />
                <CardTitle>Mobile Record Entry</CardTitle>
              </div>
              <CardDescription>
                Create records with camera and voice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Use your camera to attach images and voice input to easily add health records on the go.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/mobile/emergency">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Map className="h-5 w-5 text-red-600" />
                <CardTitle>Emergency Features</CardTitle>
              </div>
              <CardDescription>
                Location-based emergency services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Find nearby emergency facilities, share your location, and access emergency contacts quickly.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/mobile/settings">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <CardTitle>Mobile Settings</CardTitle>
              </div>
              <CardDescription>
                Configure your mobile experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Enable push notifications, manage offline storage, and customize your mobile experience.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            <CardTitle>Installation</CardTitle>
          </div>
          <CardDescription>
            Install PHRM-Diag on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            PHRM-Diag is a Progressive Web App (PWA) that can be installed on your device for offline access. Look for the "Install" or "Add to Home Screen" option in your browser.
          </p>
          <Button className="w-full">
            Install PHRM-Diag
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
