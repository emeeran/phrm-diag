import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/predictive/:id
 * Fetch a specific predictive insight by ID
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
    const insightId = params.id;
    
    // Query the database for the insight
    const insight = await prisma.predictiveInsight.findUnique({
      where: { id: insightId },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // Check if the insight belongs to the current user
    if (insight.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Error fetching predictive insight:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictive insight' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/predictive/:id
 * Update a specific predictive insight (mark as read, update validity, etc.)
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
    const insightId = params.id;
    const body = await req.json();
    const { isRead } = body;
    
    // Find the insight and verify ownership
    const insight = await prisma.predictiveInsight.findUnique({
      where: { id: insightId },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    if (insight.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the insight
    const updatedInsight = await prisma.predictiveInsight.update({
      where: { id: insightId },
      data: { isRead },
    });

    return NextResponse.json({ success: true, insight: updatedInsight });
  } catch (error) {
    console.error('Error updating predictive insight:', error);
    return NextResponse.json(
      { error: 'Failed to update predictive insight' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predictive/:id
 * Delete a specific predictive insight
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
    const insightId = params.id;
    
    // Find the insight and verify ownership
    const insight = await prisma.predictiveInsight.findUnique({
      where: { id: insightId },
    });

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    if (insight.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the insight
    await prisma.predictiveInsight.delete({
      where: { id: insightId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting predictive insight:', error);
    return NextResponse.json(
      { error: 'Failed to delete predictive insight' },
      { status: 500 }
    );
  }
}
