import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get all emergency contacts for the current user
export async function GET(req: NextRequest) {
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
    
    const contacts = await prisma.emergencyContact.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency contacts' },
      { status: 500 }
    );
  }
}

// POST: Create a new emergency contact
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
    const { name, relationship, phoneNumber, email, address, notes } = data;
    
    if (!name || !relationship || !phoneNumber) {
      return NextResponse.json({ 
        error: 'Name, relationship and phone number are required' 
      }, { status: 400 });
    }
    
    const contact = await prisma.emergencyContact.create({
      data: {
        name,
        relationship,
        phoneNumber,
        email,
        address,
        notes,
        userId: user.id
      }
    });
    
    // Create notification for new emergency contact
    await prisma.notification.create({
      data: {
        title: 'Emergency Contact Added',
        message: `You've added ${name} as an emergency contact.`,
        type: 'info',
        userId: user.id
      }
    });
    
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    return NextResponse.json(
      { error: 'Failed to create emergency contact' },
      { status: 500 }
    );
  }
}
