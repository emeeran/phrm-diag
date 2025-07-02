import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get invitation details
export async function GET(
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
      include: {
        fromUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }
    
    // Check if the invitation is for the current user
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }
    
    return NextResponse.json({
      fromName: invitation.fromUser.name,
      fromEmail: invitation.fromUser.email,
      permission: invitation.permission,
    });
  } catch (error: any) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}
