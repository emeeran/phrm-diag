'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, AlertCircle, PhoneCall, Loader2 } from 'lucide-react'
import { LoadingState } from '@/components/ui/loading'

interface EmergencyLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface EmergencyService {
  name: string
  type: string
  distance: number
  address: string
  phone: string
  coordinates: {
    latitude: number
    longitude: number
  }
}

export function LocationEmergency() {
  const [isLocating, setIsLocating] = useState(false)
  const [location, setLocation] = useState<EmergencyLocation | null>(null)
  const [locationError, setLocationError] = useState('')
  const [nearbyServices, setNearbyServices] = useState<EmergencyService[]>([])
  const [isFinding, setIsFinding] = useState(false)

  // Get current location
  const getCurrentLocation = () => {
    setIsLocating(true)
    setLocationError('')
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      setIsLocating(false)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }
        
        setLocation(newLocation)
        setIsLocating(false)
        findNearbyServices(newLocation)
      },
      (error) => {
        let errorMessage = 'Failed to get your location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        
        setLocationError(errorMessage)
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Find nearby emergency services
  const findNearbyServices = async (locationData: EmergencyLocation) => {
    setIsFinding(true)
    
    try {
      const response = await fetch('/api/emergency/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to find nearby emergency services')
      }
      
      const data = await response.json()
      setNearbyServices(data.nearbyServices)
    } catch (error) {
      console.error('Error finding emergency services:', error)
    } finally {
      setIsFinding(false)
    }
  }

  // Format coordinates for display
  const formatCoords = (coords: number) => {
    return coords.toFixed(6)
  }

  // Call emergency service
  const callEmergencyService = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`
  }

  // Open maps app with directions
  const openDirections = (service: EmergencyService) => {
    if (location) {
      // For mobile devices, open in maps app
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${service.coordinates.latitude},${service.coordinates.longitude}&travelmode=driving`
      window.open(mapsUrl, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-red-600" />
          <CardTitle>Emergency Location Services</CardTitle>
        </div>
        <CardDescription>Find nearby emergency medical facilities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!location && (
          <Button
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="w-full"
          >
            {isLocating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding your location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Share My Location
              </>
            )}
          </Button>
        )}
        
        {locationError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md flex space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{locationError}</p>
          </div>
        )}
        
        {location && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Your Location</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isLocating}
                >
                  {isLocating ? 'Updating...' : 'Update'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <p className="text-gray-500">Latitude</p>
                  <p>{formatCoords(location.latitude)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Longitude</p>
                  <p>{formatCoords(location.longitude)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Accuracy</p>
                  <p>{Math.round(location.accuracy)} meters</p>
                </div>
                <div>
                  <p className="text-gray-500">Updated</p>
                  <p>{new Date(location.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Nearby Emergency Services</h3>
              
              {isFinding ? (
                <LoadingState message="Finding nearby facilities..." />
              ) : nearbyServices.length > 0 ? (
                <div className="space-y-4">
                  {nearbyServices.map((service, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">{service.name}</h4>
                            <p className="text-sm text-gray-500">{service.address}</p>
                            <p className="text-sm text-gray-500">
                              {service.distance.toFixed(1)} km away
                            </p>
                          </div>
                          <Button
                            size="icon"
                            onClick={() => callEmergencyService(service.phone)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => callEmergencyService(service.phone)}
                          >
                            Call {service.phone}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDirections(service)}
                          >
                            Get Directions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No nearby emergency services found.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
