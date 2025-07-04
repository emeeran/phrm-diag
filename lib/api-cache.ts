/**
 * API response caching middleware and utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { memoryCache } from './cache';

// Cache response type for API responses
export interface CacheResponse {
  data: any;
  cached?: boolean;
  timestamp?: number;
}

// Cache configuration for different endpoints
const CACHE_CONFIG = {
  '/api/health-records': { ttl: 5 * 60 * 1000, key: 'health-records' }, // 5 minutes
  '/api/family-members': { ttl: 10 * 60 * 1000, key: 'family-members' }, // 10 minutes
  '/api/analytics': { ttl: 15 * 60 * 1000, key: 'analytics' }, // 15 minutes
  '/api/ai/models': { ttl: 60 * 60 * 1000, key: 'ai-models' }, // 1 hour
} as const;

// Generate cache key based on request
function generateCacheKey(request: NextRequest, baseKey: string): string {
  const url = new URL(request.url);
  const userId = request.headers.get('x-user-id') || 'anonymous';
  const params = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${baseKey}:${userId}:${params}`;
}

// Cache middleware factory
export function withAPICache(config?: { ttl?: number; key?: string }) {
  return function cacheMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return handler(req);
      }

      const url = new URL(req.url);
      const pathname = url.pathname;
      
      // Get cache configuration
      const cacheConfig = config || CACHE_CONFIG[pathname as keyof typeof CACHE_CONFIG];
      if (!cacheConfig || !cacheConfig.key || !cacheConfig.ttl) {
        return handler(req);
      }

      const cacheKey = generateCacheKey(req, cacheConfig.key!);
      
      // Try to get cached response
      const cachedResponse = memoryCache.get(cacheKey);
      if (cachedResponse) {
        return new NextResponse(JSON.stringify(cachedResponse.data), {
          status: cachedResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${Math.floor((cacheConfig.ttl ?? 60 * 60 * 1000) / 1000)}`,
          },
        });
      }

      // Execute handler and cache response
      try {
        const response = await handler(req);
        const responseData = await response.json();
        
        // Cache successful responses
        if (response.status === 200) {
          memoryCache.set(cacheKey, {
            data: responseData,
            status: response.status,
          }, cacheConfig.ttl);
        }

        return new NextResponse(JSON.stringify(responseData), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${Math.floor((cacheConfig.ttl ?? 60 * 60 * 1000) / 1000)}`,
          },
        });
      } catch (error) {
        console.error('Cache middleware error:', error);
        return handler(req);
      }
    };
  };
}

// Alias for compatibility with API route imports
export const withCache = withAPICache;

// Cache invalidation helper
export function invalidateAPICache(pattern: string, userId?: string) {
  const cacheKeys = Array.from(memoryCache['cache'].keys());
  
  cacheKeys.forEach(key => {
    if (key.includes(pattern) && (!userId || key.includes(userId))) {
      memoryCache.delete(key);
    }
  });
}

// Response compression utility
export function compressResponse(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Response compression error:', error);
    return JSON.stringify({ error: 'Failed to serialize response' });
  }
}

// Rate limiting with caching
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private maxAttempts: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return false;
    }

    if (attempt.count >= this.maxAttempts) {
      return true;
    }

    attempt.count++;
    return false;
  }

  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - attempt.count);
  }

  cleanup() {
    const now = Date.now();
    for (const entry of Array.from(this.attempts.entries())) {
      const [key, attempt] = entry;
      if (now > attempt.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

// Cleanup expired rate limits every 5 minutes (Node.js only)
if (typeof window === 'undefined') {
  setInterval(() => {
    globalRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

// ETags for conditional requests
export function generateETag(data: any): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}

export function handleConditionalRequest(
  request: NextRequest,
  data: any
): NextResponse | null {
  const etag = generateETag(data);
  const ifNoneMatch = request.headers.get('if-none-match');

  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  return null;
}
