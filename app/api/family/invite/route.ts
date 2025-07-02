import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
// In a real application, you would send an actual email
// This is just a mock function for demonstration purposes
import { sendInvitationEmail } from '@/lib/email/send-invitation';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, permission } = await req.json();
    
    // Check if email is valid
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    
    // Check if permission is valid
    if (!['view', 'edit', 'admin'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 });
    }
    
    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if invited user already exists
    let invitedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    // Generate token for invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Token expires in 7 days
    
    // Create invitation in database
    const invitation = await prisma.familyInvitation.create({
      data: {
        email,
        token,
        expires: expiryDate,
        permission,
        fromUserId: currentUser.id
      }
    });

    // If the invited user already exists, we can create the relationship immediately
    if (invitedUser) {
      // Check if already a family member
      const existingRelation = await prisma.familyMember.findUnique({
        where: {
          primaryUserId_memberUserId: {
            primaryUserId: currentUser.id,
            memberUserId: invitedUser.id
          }
        }
      });

      if (existingRelation) {
        return NextResponse.json({ 
          error: 'This user is already a family member' 
        }, { status: 400 });
      }
    }

    // Send invitation email (mock function)
    await sendInvitationEmail({
      to: email,
      fromName: currentUser.name || currentUser.email,
      invitationLink: `${process.env.NEXTAUTH_URL}/invitations/${token}`,
      permission
    });

    return NextResponse.json({ 
      success: true, 
      message: `Invitation sent to ${email}`
    });
  } catch (error: any) {
    console.error('Error sending family invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
