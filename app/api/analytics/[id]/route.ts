import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

/**
 * Get a specific health analysis by ID
 * GET /api/analytics/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to access this endpoint' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const analysisId = params.id;

    // Get the specific analysis
    const analysis = await prisma.healthAnalysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this analysis or is family member with permission
    if (analysis.userId !== userId) {
      // Check if the user is a family member with permission
      const familyMember = await prisma.familyMember.findFirst({
        where: {
          familyId: {
            equals: analysis.userId,
          },
          userId: userId,
          role: {
            in: ['ADMIN', 'VIEWER'],
          },
        },
      });

      if (!familyMember) {
        return NextResponse.json(
          { error: 'You do not have permission to view this analysis' },
          { status: 403 }
        );
      }
    }

    // Log the access
    await createAuditLog({
      userId,
      action: 'view',
      resourceType: 'health_analysis',
      resourceId: analysis.id,
      description: `Viewed ${analysis.analysisType} health analysis`,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error retrieving analysis:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve health analysis' },
      { status: 500 }
    );
  }
}
