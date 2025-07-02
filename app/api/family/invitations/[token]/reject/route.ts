import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Reject invitation
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
    
    // Delete the invitation
    await prisma.familyInvitation.delete({
      where: {
        token,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Invitation rejected successfully',
    });
  } catch (error: any) {
    console.error('Error rejecting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to reject invitation' },
      { status: 500 }
    );
  }
}
