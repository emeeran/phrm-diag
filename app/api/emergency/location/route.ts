import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { latitude, longitude, accuracy } = await req.json()
    
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      typeof accuracy !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid location data' },
        { status: 400 }
      )
    }
    
    // In a real app, we would:
    // 1. Store this location in the database
    // 2. Send it to emergency contacts if needed
    // 3. Find nearby emergency services
    
    // For now, let's just mock finding nearby emergency services
    const nearbyServices = mockNearbyEmergencyServices(latitude, longitude)
    
    return NextResponse.json({
      success: true,
      locationReceived: { latitude, longitude, accuracy },
      nearbyServices
    })
  } catch (error) {
    console.error('Error processing emergency location:', error)
    return NextResponse.json(
      { error: 'Failed to process emergency location' },
      { status: 500 }
    )
  }
}

// Mock function to simulate finding emergency services
function mockNearbyEmergencyServices(latitude: number, longitude: number) {
  // This would be replaced with actual API calls to a service like Google Maps
  return [
    {
      name: 'City General Hospital',
      type: 'hospital',
      distance: 2.4, // km
      address: '123 Medical Dr',
      phone: '(555) 123-4567',
      coordinates: {
        latitude: latitude + 0.01,
        longitude: longitude - 0.01
      }
    },
    {
      name: 'Downtown Emergency Center',
      type: 'emergency_room',
      distance: 3.7, // km
      address: '456 Urgent St',
      phone: '(555) 987-6543',
      coordinates: {
        latitude: latitude - 0.02,
        longitude: longitude + 0.01
      }
    },
    {
      name: 'Westside Urgent Care',
      type: 'urgent_care',
      distance: 1.8, // km
      address: '789 Quick Ave',
      phone: '(555) 456-7890',
      coordinates: {
        latitude: latitude + 0.008,
        longitude: longitude + 0.015
      }
    }
  ]
}
