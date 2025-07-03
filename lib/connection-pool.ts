/**
 * Connection pooling and database connection management
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  // Maximum number of database connections in the pool
  connectionLimit: process.env.DATABASE_CONNECTION_LIMIT 
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT) 
    : 10,
    
  // Connection timeout in milliseconds
  connectTimeout: process.env.DATABASE_CONNECT_TIMEOUT 
    ? parseInt(process.env.DATABASE_CONNECT_TIMEOUT) 
    : 60000,
    
  // Pool timeout in milliseconds
  poolTimeout: process.env.DATABASE_POOL_TIMEOUT 
    ? parseInt(process.env.DATABASE_POOL_TIMEOUT) 
    : 60000,
};

// Enhanced Prisma client with connection pooling
export function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
    
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    
    // Connection pool settings via URL parameters
    // These are typically set in DATABASE_URL, but can be configured here
    __internal: {
      engine: {
        // Connection pool size
        connectionLimit: CONNECTION_POOL_CONFIG.connectionLimit,
        
        // Connection timeout
        connectTimeout: CONNECTION_POOL_CONFIG.connectTimeout,
        
        // Pool timeout
        poolTimeout: CONNECTION_POOL_CONFIG.poolTimeout,
      },
    } as any,
  });

  // Add connection event listeners
  client.$on('query' as any, (e: any) => {
    if (e.duration > 1000) {
      console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
    }
  });

  return client;
}

// Singleton pattern for connection pooling
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Connection pool monitoring
export class ConnectionPoolMonitor {
  private static instance: ConnectionPoolMonitor;
  private metrics = {
    activeConnections: 0,
    totalQueries: 0,
    slowQueries: 0,
    errors: 0,
    lastError: null as string | null,
  };

  static getInstance(): ConnectionPoolMonitor {
    if (!ConnectionPoolMonitor.instance) {
      ConnectionPoolMonitor.instance = new ConnectionPoolMonitor();
    }
    return ConnectionPoolMonitor.instance;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  incrementActiveConnections() {
    this.metrics.activeConnections++;
  }

  decrementActiveConnections() {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  recordQuery(duration: number) {
    this.metrics.totalQueries++;
    if (duration > 1000) {
      this.metrics.slowQueries++;
    }
  }

  recordError(error: string) {
    this.metrics.errors++;
    this.metrics.lastError = error;
  }

  reset() {
    this.metrics = {
      activeConnections: 0,
      totalQueries: 0,
      slowQueries: 0,
      errors: 0,
      lastError: null,
    };
  }
}

// Connection wrapper with monitoring
export class MonitoredConnection {
  private monitor = ConnectionPoolMonitor.getInstance();

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.monitor.incrementActiveConnections();
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      this.monitor.recordQuery(duration);
      return result;
    } catch (error) {
      this.monitor.recordError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      this.monitor.decrementActiveConnections();
    }
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  connectionCount: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    
    // Get connection pool metrics
    const monitor = ConnectionPoolMonitor.getInstance();
    const metrics = monitor.getMetrics();
    
    return {
      status: 'healthy',
      latency,
      connectionCount: metrics.activeConnections,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      status: 'unhealthy',
      latency,
      connectionCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Graceful shutdown handler
export async function gracefulShutdown(): Promise<void> {
  console.log('Shutting down database connections...');
  
  try {
    await prisma.$disconnect();
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Error during database shutdown:', error);
  }
}

// Register shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('beforeExit', gracefulShutdown);
}

// Connection pool optimization utilities
export const connectionUtils = {
  // Warm up the connection pool
  async warmUp(): Promise<void> {
    try {
      await prisma.$connect();
      console.log('Database connection pool warmed up');
    } catch (error) {
      console.error('Failed to warm up connection pool:', error);
    }
  },

  // Test connection pool performance
  async benchmarkQueries(iterations: number = 100): Promise<{
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    errors: number;
  }> {
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        latencies.push(Date.now() - startTime);
      } catch (error) {
        errors++;
      }
    }

    return {
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      errors,
    };
  },

  // Get connection pool status
  getPoolStatus(): {
    configured: typeof CONNECTION_POOL_CONFIG;
    current: ReturnType<ConnectionPoolMonitor['getMetrics']>;
  } {
    return {
      configured: CONNECTION_POOL_CONFIG,
      current: ConnectionPoolMonitor.getInstance().getMetrics(),
    };
  },
};
