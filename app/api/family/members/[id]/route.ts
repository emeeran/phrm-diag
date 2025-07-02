import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Update or delete a family member
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { permission } = await req.json();

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the user owns this family member
    const familyMember = await prisma.familyMember.findUnique({
      where: {
        id: params.id,
        primaryUserId: currentUser.id // Ensure the current user is the owner
      }
    });

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found or you do not have permission' }, { status: 404 });
    }

    // Update permission
    const updatedMember = await prisma.familyMember.update({
      where: { id: params.id },
      data: {
        permission
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

    return NextResponse.json({
      id: updatedMember.id,
      name: updatedMember.member.name,
      email: updatedMember.member.email,
      permission: updatedMember.permission,
      status: "active",
      memberUserId: updatedMember.memberUserId,
      primaryUserId: updatedMember.primaryUserId
    });
  } catch (error: any) {
    console.error('Error updating family member:', error);
    return NextResponse.json(
      { error: 'Failed to update family member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify the user owns this family member
    const familyMember = await prisma.familyMember.findUnique({
      where: {
        id: params.id,
        primaryUserId: currentUser.id // Ensure the current user is the owner
      }
    });

    if (!familyMember) {
      return NextResponse.json({ error: 'Family member not found or you do not have permission' }, { status: 404 });
    }

    // Delete the family member
    await prisma.familyMember.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting family member:', error);
    return NextResponse.json(
      { error: 'Failed to delete family member' },
      { status: 500 }
    );
  }
}
