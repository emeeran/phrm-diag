import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/alerts/:id
 * Fetch a specific alert by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const alertId = params.id;
    
    // Query the database for the alert
    const alert = await prisma.healthAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Check if the alert belongs to the current user
    if (alert.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error fetching health alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health alert' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/alerts/:id
 * Update a specific alert (dismiss, mark as read, etc.)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const alertId = params.id;
    const body = await req.json();
    const { dismissed } = body;
    
    // Find the alert and verify ownership
    const alert = await prisma.healthAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (alert.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the alert
    const updatedAlert = await prisma.healthAlert.update({
      where: { id: alertId },
      data: { dismissed },
    });

    return NextResponse.json({ success: true, alert: updatedAlert });
  } catch (error) {
    console.error('Error updating health alert:', error);
    return NextResponse.json(
      { error: 'Failed to update health alert' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/:id
 * Delete a specific alert
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const alertId = params.id;
    
    // Find the alert and verify ownership
    const alert = await prisma.healthAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    if (alert.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the alert
    await prisma.healthAlert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting health alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete health alert' },
      { status: 500 }
    );
  }
}
