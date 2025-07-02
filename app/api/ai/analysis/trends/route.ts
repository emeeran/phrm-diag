import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeHealthTrends } from '@/lib/ai/health-analysis';

export async function GET(req: NextRequest) {
  // Verify user is authenticated
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get trends analysis
    const analysis = await analyzeHealthTrends(user.id);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Health trend analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze health trends', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
