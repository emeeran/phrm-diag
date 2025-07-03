import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateHealthAnalytics, AnalysisType } from '@/lib/analytics';
import { createAuditLog } from '@/lib/audit';

/**
 * Generate a health analysis based on health records
 * POST /api/analytics/generate
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { analysisType } = await req.json();

    // Validate analysis type
    if (!['trends', 'medication', 'risk', 'symptoms'].includes(analysisType)) {
      return NextResponse.json(
        { error: 'Invalid analysis type' },
        { status: 400 }
      );
    }

    // Check user's consent
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { analyticsConsent: true },
    });

    if (!user?.analyticsConsent) {
      return NextResponse.json(
        { error: 'Analytics consent is required to use this feature' },
        { status: 403 }
      );
    }

    // Generate the analysis
    const analysisId = await generateHealthAnalytics(
      userId,
      analysisType as AnalysisType
    );

    // Log the action
    await createAuditLog({
      userId,
      action: 'generate',
      resourceType: 'health_analysis',
      resourceId: analysisId,
      description: `Generated ${analysisType} health analysis`,
    });

    return NextResponse.json({ analysisId });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate health analytics' },
      { status: 500 }
    );
  }
}
