import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fetch all family members for the current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all family members where the current user is the primary user
    const familyMembers = await prisma.familyMember.findMany({
      where: {
        primaryUserId: currentUser.id
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format the response
    const formattedMembers = familyMembers.map(member => ({
      id: member.id,
      name: member.member.name,
      email: member.member.email,
      permission: member.permission,
      status: "active", // For now we don't have a separate invitation status
      memberUserId: member.memberUserId,
      primaryUserId: member.primaryUserId
    }));

    return NextResponse.json(formattedMembers);
  } catch (error: any) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family members' }, 
      { status: 500 }
    );
  }
}
