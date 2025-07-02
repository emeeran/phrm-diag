import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkMedicationInteractions } from '@/lib/ai/medication-checker';

export async function POST(req: NextRequest) {
  // Verify user is authenticated
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { medications } = await req.json();
    
    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return NextResponse.json(
        { error: 'At least two medications are required' },
        { status: 400 }
      );
    }

    // Check medication interactions
    const interactionResult = await checkMedicationInteractions(medications);

    // Get user ID from email for analytics purposes
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (user) {
      // Save the analysis for analytics (optional)
      await prisma.healthAnalysis.create({
        data: {
          userId: user.id,
          summary: interactionResult.summary,
          trends: interactionResult.interactions,
          recordsAnalyzed: medications.length,
          aiModelUsed: "gpt-4", // Hard-coded as this always uses GPT-4
          cost: 0, // We don't have this info directly
          analysisType: 'medication',
        },
      });
    }

    return NextResponse.json(interactionResult);
  } catch (error: any) {
    console.error('Medication interaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to check medication interactions', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
