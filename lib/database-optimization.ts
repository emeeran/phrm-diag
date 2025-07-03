/**
 * Database query optimization utilities
 */

import { PrismaClient } from '@prisma/client';

// Optimized Prisma client with connection pooling
export function createOptimizedPrismaClient() {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    
    // Connection pool optimization
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Query optimization helpers
export class QueryOptimizer {
  constructor(private prisma: PrismaClient) {}

  // Optimized health records query with pagination and selective fields
  async getHealthRecordsOptimized({
    userId,
    limit = 20,
    offset = 0,
    includeDocuments = false,
    dateRange,
    category,
  }: {
    userId: string;
    limit?: number;
    offset?: number;
    includeDocuments?: boolean;
    dateRange?: { from: Date; to: Date };
    category?: string;
  }) {
    const where = {
      userId,
      ...(category && { category }),
      ...(dateRange && {
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }),
    };

    // Use Promise.all for parallel queries
    const [records, totalCount] = await Promise.all([
      this.prisma.healthRecord.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          // Conditionally include documents
          ...(includeDocuments && {
            documents: {
              select: {
                id: true,
                filename: true,
                fileSize: true,
                mimeType: true,
                createdAt: true,
              },
            },
          }),
        },
      }),
      this.prisma.healthRecord.count({ where }),
    ]);

    return {
      records,
      totalCount,
      hasMore: offset + limit < totalCount,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    };
  }

  // Optimized family members query
  async getFamilyMembersOptimized(userId: string) {
    return this.prisma.familyMember.findMany({
      where: {
        OR: [
          { userId },
          { familyId: { in: await this.getUserFamilyIds(userId) } },
        ],
      },
      select: {
        id: true,
        userId: true,
        familyId: true,
        role: true,
        permissions: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Optimized AI interactions query with aggregation
  async getAIInteractionsStats(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.aIInteraction.aggregate({
      where: {
        userId,
        createdAt: { gte: since },
      },
      _count: { id: true },
      _sum: { 
        tokensUsed: true,
        cost: true,
      },
      _avg: {
        responseTime: true,
        cost: true,
      },
    });
  }

  // Batch operations for better performance
  async createMultipleHealthRecords(records: any[]) {
    return this.prisma.healthRecord.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  // Optimized search with full-text search
  async searchHealthRecords(userId: string, query: string, limit = 10) {
    // Using Prisma's full-text search capabilities
    return this.prisma.healthRecord.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: [
        { _relevance: { fields: ['title', 'description'], search: query, sort: 'desc' } },
        { date: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        category: true,
      },
    });
  }

  // Helper method to get user's family IDs
  private async getUserFamilyIds(userId: string): Promise<string[]> {
    const familyMembers = await this.prisma.familyMember.findMany({
      where: { userId },
      select: { familyId: true },
    });
    return familyMembers.map(fm => fm.familyId);
  }

  // Database maintenance and optimization
  async runMaintenance() {
    // Clean up old AI interactions (keep only last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    await this.prisma.aIInteraction.deleteMany({
      where: {
        createdAt: { lt: sixMonthsAgo },
      },
    });

    // Clean up orphaned documents
    await this.prisma.document.deleteMany({
      where: {
        healthRecordId: null,
      },
    });

    console.log('Database maintenance completed');
  }
}

// Connection pool management
export class ConnectionPoolManager {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = createOptimizedPrismaClient();
    }
    return ConnectionPoolManager.instance;
  }

  static async disconnect() {
    if (ConnectionPoolManager.instance) {
      await ConnectionPoolManager.instance.$disconnect();
    }
  }
}

// Query performance monitoring
export function withQueryTiming<T extends (...args: any[]) => Promise<any>>(
  queryName: string,
  queryFunction: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await queryFunction(...args);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) { // Log slow queries (>1s)
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${queryName} (${duration}ms)`, error);
      throw error;
    }
  }) as T;
}

export const optimizedPrisma = ConnectionPoolManager.getInstance();
export const queryOptimizer = new QueryOptimizer(optimizedPrisma);
