import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get a specific emergency contact
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const contact = await prisma.emergencyContact.findUnique({
      where: {
        id: params.id,
        userId: user.id
      }
    });
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching emergency contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency contact' },
      { status: 500 }
    );
  }
}

// PUT: Update an emergency contact
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const contact = await prisma.emergencyContact.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        name,
        relationship,
        phoneNumber,
        email,
        address,
        notes
      }
    });
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    return NextResponse.json(
      { error: 'Failed to update emergency contact' },
      { status: 500 }
    );
  }
}

// DELETE: Remove (deactivate) an emergency contact
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Instead of hard deleting, mark as inactive
    const contact = await prisma.emergencyContact.update({
      where: {
        id: params.id,
        userId: user.id
      },
      data: {
        isActive: false
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating emergency contact:', error);
    return NextResponse.json(
      { error: 'Failed to remove emergency contact' },
      { status: 500 }
    );
  }
}
