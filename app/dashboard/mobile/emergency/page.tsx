'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LocationEmergency } from '@/components/mobile/location-emergency'
import { ArrowLeft, User, Phone, AlertCircle, ScanFace, UserRoundSearch } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MobileEmergencyPage() {
  const router = useRouter()
  
  const emergencyProfiles = [
    {
      id: 'user',
      name: 'Your Emergency Profile',
      description: 'Your personal medical information for emergency situations',
      icon: <User className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'contacts',
      name: 'Emergency Contacts',
      description: 'Quick access to your emergency contacts',
      icon: <Phone className="h-5 w-5 text-green-600" />
    },
    {
      id: 'family',
      name: 'Family Members',
      description: 'Emergency profiles for your family members',
      icon: <UserRoundSearch className="h-5 w-5 text-purple-600" />
    }
  ]
  
  const handleEmergencyAlert = () => {
    if (window.confirm('This will send an emergency alert to your emergency contacts. Continue?')) {
      // Simulate sending emergency alert
      console.log('Emergency alert triggered!')
      router.push('/dashboard/emergency')
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Emergency Access</h1>
          <p className="text-sm text-gray-500">
            Quick access to critical health information
          </p>
        </div>
      </div>
      
      <Button 
        variant="destructive" 
        className="w-full py-8 text-lg"
        onClick={handleEmergencyAlert}
      >
        <AlertCircle className="h-6 w-6 mr-2" />
        Trigger Emergency Alert
      </Button>
      
      <div className="grid grid-cols-1 gap-4">
        {emergencyProfiles.map((profile) => (
          <Link href={`/dashboard/emergency/${profile.id}`} key={profile.id}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  {profile.icon}
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{profile.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      <Card className="border-2 border-red-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ScanFace className="h-5 w-5 text-red-600" />
            <CardTitle>Lock Screen Medical ID</CardTitle>
          </div>
          <CardDescription>
            Make critical information available even when your phone is locked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">
            Set Up Medical ID
          </Button>
        </CardContent>
      </Card>
      
      <LocationEmergency />
    </div>
  )
}
