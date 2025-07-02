import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get health records for family members
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
    
    // Get all family members where the current user is a member of their family
    // with permissions to view their records
    const familyRelations = await prisma.familyMember.findMany({
      where: {
        memberUserId: user.id,
        OR: [
          { permission: 'view' },
          { permission: 'edit' },
          { permission: 'admin' }
        ]
      },
      include: {
        primaryUser: true
      }
    });
    
    // Get health records for all family members
    const familyMemberIds = familyRelations.map(relation => relation.primaryUserId);
    
    // Include the user's own records
    familyMemberIds.push(user.id);
    
    const healthRecords = await prisma.healthRecord.findMany({
      where: {
        userId: {
          in: familyMemberIds
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        documents: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    return NextResponse.json(healthRecords);
  } catch (error) {
    console.error('Error fetching family health records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family health records' },
      { status: 500 }
    );
  }
}
