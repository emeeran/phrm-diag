import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { withCache, CacheResponse } from '@/lib/api-cache';
import { optimizedPrismaClient } from '@/lib/database-optimization';
import { getConnectionPool } from '@/lib/connection-pool';

/**
 * Get a list of all health analyses for the user
 * GET /api/analytics/
 */
export async function GET(req: NextRequest) {
  return withCache(async () => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'You must be signed in to access this endpoint' },
          { status: 401 }
        );
      }

      const userId = session.user.id;
      const prisma = await getConnectionPool();

      // Optimized query with proper indexing and selective fields
      const analyses = await optimizedPrismaClient.findManyOptimized(
        'healthAnalysis',
        {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            summary: true,
            analysisType: true,
            createdAt: true,
            recordsAnalyzed: true,
          },
        },
        { 
          enableCache: true,
          ttl: 5 * 60 * 1000, // 5 minutes cache
          queryHint: 'analytics_list'
        }
      );

      return NextResponse.json(analyses);
    } catch (error) {
      console.error('Error retrieving analytics:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve health analytics' },
        { status: 500 }
      );
    }
  }, {
    cacheKey: `analytics-list-${req.nextUrl.searchParams.toString()}`,
    ttl: 5 * 60 * 1000, // 5 minutes
    revalidateOnStale: true,
    tags: ['analytics', 'user-data']
  }) as Promise<CacheResponse>;
}
