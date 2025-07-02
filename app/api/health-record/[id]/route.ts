import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get a single health record by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // First, try to find the record directly owned by the user
  let record = await prisma.healthRecord.findFirst({
    where: { 
      id: params.id, 
      userId: user.id 
    },
    include: { 
      documents: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    },
  });
  
  // If not found, check if it belongs to a family member and the user has permission
  if (!record) {
    // Find all family members where the user is a member with view permission or higher
    const familyRelations = await prisma.familyMember.findMany({
      where: {
        memberUserId: user.id,
        OR: [
          { permission: 'view' },
          { permission: 'edit' },
          { permission: 'admin' }
        ]
      }
    });
    
    const familyUserIds = familyRelations.map(relation => relation.primaryUserId);
    
    if (familyUserIds.length > 0) {
      record = await prisma.healthRecord.findFirst({
        where: { 
          id: params.id, 
          userId: { in: familyUserIds } 
        },
        include: { 
          documents: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
      });
    }
  }
  
  if (!record) {
    return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
  }
  
  return NextResponse.json(record);
}

// PUT: Update a health record by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // Check if record exists and belongs to user
  const existingRecord = await prisma.healthRecord.findUnique({
    where: { id: params.id }
  });
  
  if (!existingRecord) {
    return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
  }
  
  // If the record belongs to the current user, they can edit it
  let canEdit = existingRecord.userId === user.id;
  
  // If the record belongs to a family member, check permissions
  if (!canEdit) {
    const familyRelation = await prisma.familyMember.findFirst({
      where: {
        primaryUserId: existingRecord.userId,
        memberUserId: user.id,
        OR: [
          { permission: 'edit' },
          { permission: 'admin' }
        ]
      }
    });
    
    canEdit = !!familyRelation;
  }
  
  if (!canEdit) {
    return NextResponse.json({ error: 'You do not have permission to edit this record' }, { status: 403 });
  }
  
  const data = await req.json();
  const { title, description, date, category } = data;
  
  const record = await prisma.healthRecord.update({
    where: { id: params.id },
    data: { title, description, date: new Date(date), category },
  });
  
  // If the user is editing someone else's record, create a notification
  if (existingRecord.userId !== user.id) {
    await prisma.notification.create({
      data: {
        title: 'Health Record Updated',
        message: `${user.name || user.email} updated your health record "${record.title}"`,
        type: 'info',
        userId: existingRecord.userId,
        relatedRecordId: record.id
      }
    });
  }
  
  return NextResponse.json(record);
}

// DELETE: Delete a health record by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  // Check if record exists
  const existingRecord = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: { user: true }
  });
  
  if (!existingRecord) {
    return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
  }
  
  // If the record belongs to the current user, they can delete it
  let canDelete = existingRecord.userId === user.id;
  
  // If the record belongs to a family member, check permissions
  if (!canDelete) {
    const familyRelation = await prisma.familyMember.findFirst({
      where: {
        primaryUserId: existingRecord.userId,
        memberUserId: user.id,
        permission: 'admin'
      }
    });
    
    canDelete = !!familyRelation;
  }
  
  if (!canDelete) {
    return NextResponse.json({ error: 'You do not have permission to delete this record' }, { status: 403 });
  }
  
  // Store record info for notification
  const recordTitle = existingRecord.title;
  const recordOwner = existingRecord.userId;
  
  await prisma.healthRecord.delete({ where: { id: params.id } });
  
  // If the user is deleting someone else's record, create a notification
  if (recordOwner !== user.id) {
    await prisma.notification.create({
      data: {
        title: 'Health Record Deleted',
        message: `${user.name || user.email} deleted your health record "${recordTitle}"`,
        type: 'alert',
        userId: recordOwner
      }
    });
  }
  
  return NextResponse.json({ success: true });
}
