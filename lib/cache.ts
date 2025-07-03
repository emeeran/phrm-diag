/**
 * Client-side caching utilities for performance optimization
 */
'use client';

import { useState, useEffect } from 'react';

// Memory cache for API responses
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// LocalStorage cache with JSON serialization
class LocalStorageCache {
  private prefix = 'phrm_cache_';

  set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000) { // Default 24 hours
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  get(key: string): any | null {
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// SessionStorage cache for session-specific data
class SessionStorageCache {
  private prefix = 'phrm_session_';

  set(key: string, data: any): void {
    try {
      sessionStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error);
    }
  }

  get(key: string): any | null {
    try {
      const itemStr = sessionStorage.getItem(this.prefix + key);
      return itemStr ? JSON.parse(itemStr) : null;
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
      return null;
    }
  }

  delete(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

// Cache instances
export const memoryCache = new MemoryCache();
export const localCache = new LocalStorageCache();
export const sessionCache = new SessionStorageCache();

// Cache decorator for API functions
export function withCache(
  cacheType: 'memory' | 'local' | 'session' = 'memory',
  ttl?: number
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}_${JSON.stringify(args)}`;
      const cache = cacheType === 'memory' ? memoryCache : 
                   cacheType === 'local' ? localCache : sessionCache;

      // Try to get from cache first
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute original method and cache result
      const result = await originalMethod.apply(this, args);
      
      if (cacheType === 'memory') {
        memoryCache.set(cacheKey, result, ttl);
      } else if (cacheType === 'local') {
        localCache.set(cacheKey, result, ttl);
      } else {
        sessionCache.set(cacheKey, result);
      }

      return result;
    } as T;
  };
}

// React hook for cached API calls
export function useCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  cacheType: 'memory' | 'local' | 'session' = 'memory',
  ttl?: number
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = cacheType === 'memory' ? memoryCache : 
               cacheType === 'local' ? localCache : sessionCache;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = cache.get(key);
      if (cachedData !== null) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetchFn();
      
      // Cache the result
      if (cacheType === 'memory') {
        memoryCache.set(key, result, ttl);
      } else if (cacheType === 'local') {
        localCache.set(key, result, ttl);
      } else {
        sessionCache.set(key, result);
      }

      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Cache invalidation utilities
export const cacheUtils = {
  invalidatePattern: (pattern: string) => {
    // Invalidate memory cache
    for (const [key] of memoryCache['cache']) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }

    // Invalidate localStorage
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    }
  },

  clearAll: () => {
    memoryCache.clear();
    localCache.clear();
    sessionCache.clear();
  },

  getCacheStats: () => ({
    memorySize: memoryCache.size(),
    localStorageKeys: typeof window !== 'undefined' ? 
      Object.keys(localStorage).filter(k => k.startsWith('phrm_cache_')).length : 0,
    sessionStorageKeys: typeof window !== 'undefined' ? 
      Object.keys(sessionStorage).filter(k => k.startsWith('phrm_session_')).length : 0,
  }),
};
