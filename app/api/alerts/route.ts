import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { detectHealthAnomalies, predictMedicationRefills, trackHealthMilestones, suggestWellnessGoals } from '@/lib/smart-alerts';

/**
 * GET /api/alerts
 * Fetch all alerts for the current user
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
    const alertType = searchParams.get('type');
    const includeAll = searchParams.get('includeAll') === 'true';
    
    // Query the database for alerts
    const alerts = await prisma.healthAlert.findMany({
      where: {
        userId,
        ...(alertType ? { alertType } : {}),
        ...(includeAll ? {} : { dismissed: false })
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching health alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health alerts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Generate new alerts for the user
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
        { error: 'Alert type is required' },
        { status: 400 }
      );
    }

    let result;

    // Generate the requested alert type
    switch (type) {
      case 'anomaly':
        result = await detectHealthAnomalies(userId);
        break;
      case 'refill':
        result = await predictMedicationRefills(userId);
        break;
      case 'milestone':
        result = await trackHealthMilestones(userId);
        break;
      case 'wellness':
        result = await suggestWellnessGoals(userId);
        break;
      case 'all':
        const anomalies = await detectHealthAnomalies(userId);
        const refills = await predictMedicationRefills(userId);
        const milestones = await trackHealthMilestones(userId);
        const goals = await suggestWellnessGoals(userId);
        result = {
          anomalies,
          refills,
          milestones,
          goals
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid alert type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error generating health alerts:', error);
    return NextResponse.json(
      { error: 'Failed to generate health alerts' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/alerts/:id
 * Dismiss or update an alert
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
      data: { 
        dismissed: dismissed !== undefined ? dismissed : alert.dismissed,
      },
    });

    return NextResponse.json({ success: true, alert: updatedAlert });
  } catch (error) {
    console.error('Error updating health alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
