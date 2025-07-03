import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmergencyAlert } from '@/lib/notifications/family-notifications';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const data = await req.json();
    const { message, location } = data;
    
    if (!message) {
      return NextResponse.json({ 
        error: 'Emergency message is required' 
      }, { status: 400 });
    }
    
    // Send emergency alert to all family members
    await sendEmergencyAlert({
      fromUserId: user.id,
      message,
      location
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Emergency alert sent successfully' 
    });
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    return NextResponse.json(
      { error: 'Failed to send emergency alert' },
      { status: 500 }
    );
  }
}
