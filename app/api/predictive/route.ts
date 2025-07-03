import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateHealthRiskPredictions, generatePersonalizedRecommendations, calculateOptimalAppointmentTiming, generatePreventiveCareReminders } from '@/lib/predictive';

/**
 * GET /api/predictive
 * Fetch all predictive insights for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const insightType = searchParams.get('type');
    
    // Query the database for predictive insights
    const insights = await prisma.predictiveInsight.findMany({
      where: {
        userId,
        ...(insightType ? { insightType } : {})
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching predictive insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictive insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predictive
 * Generate new predictive insights for the user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const body = await req.json();
    const { type } = body;

    // Validate request
    if (!type) {
      return NextResponse.json(
        { error: 'Insight type is required' },
        { status: 400 }
      );
    }

    let result;

    // Generate the requested insight type
    switch (type) {
      case 'risk':
        result = await generateHealthRiskPredictions(userId);
        break;
      case 'recommendations':
        result = await generatePersonalizedRecommendations(userId);
        break;
      case 'appointments':
        result = await calculateOptimalAppointmentTiming(userId);
        break;
      case 'preventive':
        result = await generatePreventiveCareReminders(userId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid insight type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error generating predictive insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictive insights' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/predictive/:id
 * Mark a predictive insight as read
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Update the insight
    const updatedInsight = await prisma.predictiveInsight.update({
      where: { id: insightId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, insight: updatedInsight });
  } catch (error) {
    console.error('Error updating predictive insight:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}
