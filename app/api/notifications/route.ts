import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/api-cache';
import { optimizedPrismaClient } from '@/lib/database-optimization';
import { getConnectionPool } from '@/lib/connection-pool';

// GET: Get all notifications for the current user
export async function GET(req: NextRequest) {
  return withCache(async () => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const pool = await getConnectionPool();
      const user = await pool.user.findUnique({ where: { email: session.user.email } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const url = new URL(req.url);
      const onlyUnread = url.searchParams.get('unread') === 'true';
      const limit = url.searchParams.get('limit');
      const notifications = await optimizedPrismaClient.findManyOptimized(
        'notification',
        {
          where: {
            userId: user.id,
            ...(onlyUnread ? { isRead: false } : {})
          },
          orderBy: { createdAt: 'desc' },
          take: limit ? parseInt(limit) : undefined
        },
        { enableCache: true, ttl: 2 * 60 * 1000, queryHint: 'notifications_list' }
      );
      const count = await pool.notification.count({
        where: { userId: user.id, isRead: false }
      });
      return NextResponse.json({ notifications, unreadCount: count });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  }, {
    cacheKey: `notifications-list-${req.nextUrl.searchParams.toString()}`,
    ttl: 2 * 60 * 1000,
    revalidateOnStale: true,
    tags: ['notifications', 'user-data']
  });
}

// POST: Create a new notification (typically used by system)
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
    const { title, message, type, relatedRecordId, targetUserEmail } = data;
    
    if (!title || !message || !type) {
      return NextResponse.json({ 
        error: 'Title, message, and type are required' 
      }, { status: 400 });
    }
    
    // If a target user email is provided, send notification to that user
    // (only allowed for family members)
    let targetUserId = user.id;
    
    if (targetUserEmail && targetUserEmail !== user.email) {
      // Check if the target user is a family member
      const targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail }
      });
      
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }
      
      const familyRelation = await prisma.familyMember.findFirst({
        where: {
          OR: [
            { primaryUserId: user.id, memberUserId: targetUser.id },
            { primaryUserId: targetUser.id, memberUserId: user.id }
          ]
        }
      });
      
      if (!familyRelation) {
        return NextResponse.json({ 
          error: 'Cannot send notification to non-family member' 
        }, { status: 403 });
      }
      
      targetUserId = targetUser.id;
    }
    
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        relatedRecordId,
        userId: targetUserId
      }
    });
    
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
