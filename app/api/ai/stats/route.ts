import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // Verify user is authenticated
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user and their AI usage statistics
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        aiUsageStats: true,
        aiInteractions: {
          select: {
            createdAt: true,
            modelUsed: true,
            cost: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no usage stats yet
    if (!user.aiUsageStats) {
      return NextResponse.json({
        totalCost: 0,
        tokenCount: 0,
        usageCount: 0,
        lastUsedAt: null,
        dailyUsage: [],
        modelDistribution: [],
      });
    }

    // Process AI interactions for daily usage data
    const dailyUsage = processDailyUsage(user.aiInteractions);
    
    // Process AI interactions for model distribution
    const modelDistribution = processModelDistribution(user.aiInteractions);

    return NextResponse.json({
      totalCost: user.aiUsageStats.totalCost,
      tokenCount: user.aiUsageStats.tokenCount,
      usageCount: user.aiUsageStats.usageCount,
      lastUsedAt: user.aiUsageStats.lastUsedAt,
      dailyUsage,
      modelDistribution,
    });
  } catch (error: any) {
    console.error('Error fetching AI usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI usage statistics' },
      { status: 500 }
    );
  }
}

// Helper function to process interactions into daily usage data
function processDailyUsage(interactions: any[]) {
  // Map to track daily totals
  const dailyMap = new Map();
  
  interactions.forEach(interaction => {
    const date = new Date(interaction.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        cost: 0,
        count: 0,
      });
    }
    
    const day = dailyMap.get(date);
    day.cost += interaction.cost;
    day.count += 1;
  });
  
  // Convert map to array and sort by date
  return Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Helper function to process interactions into model distribution data
function processModelDistribution(interactions: any[]) {
  // Map to track model usage
  const modelMap = new Map();
  
  interactions.forEach(interaction => {
    const model = interaction.modelUsed;
    
    if (!modelMap.has(model)) {
      modelMap.set(model, {
        model,
        cost: 0,
        count: 0,
      });
    }
    
    const modelStats = modelMap.get(model);
    modelStats.cost += interaction.cost;
    modelStats.count += 1;
  });
  
  // Convert map to array and sort by usage count (descending)
  return Array.from(modelMap.values())
    .sort((a, b) => b.count - a.count);
}
