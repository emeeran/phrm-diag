import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Accept invitation
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = params.token;
    
    // Find the invitation
    const invitation = await prisma.familyInvitation.findUnique({
      where: {
        token,
        expires: {
          gt: new Date(), // Not expired
        },
        accepted: false,
      },
    });
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }
    
    // Check if the invitation is for the current user
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }
    
    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create the family member relationship
    await prisma.familyMember.create({
      data: {
        primaryUserId: invitation.fromUserId,
        memberUserId: currentUser.id,
        permission: invitation.permission,
      },
    });
    
    // Mark the invitation as accepted
    await prisma.familyInvitation.update({
      where: {
        token,
      },
      data: {
        accepted: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
