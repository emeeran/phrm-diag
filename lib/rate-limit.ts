import { RateLimiterMemory } from 'limiter';

// Map to store rate limiters by key (e.g., IP address, user ID)
const rateLimiters: Map<string, RateLimiterMemory> = new Map();

/**
 * Creates or gets a rate limiter for a specific key
 * @param key Key for the rate limiter (e.g., IP address, user ID)
 * @param tokensPerInterval Number of allowed requests per interval
 * @param interval Interval in milliseconds
 * @returns RateLimiterMemory instance
 */
function getRateLimiter(
  key: string,
  tokensPerInterval: number,
  interval: number
): RateLimiterMemory {
  const limiterKey = `${key}:${tokensPerInterval}:${interval}`;
  
  if (!rateLimiters.has(limiterKey)) {
    rateLimiters.set(
      limiterKey,
      new RateLimiterMemory({
        tokensPerInterval,
        interval,
      })
    );
  }
  
  return rateLimiters.get(limiterKey)!;
}

/**
 * Checks if a request is allowed based on rate limiting
 * @param key Key for the rate limiter (e.g., IP address, user ID)
 * @param tokensPerInterval Number of allowed requests per interval
 * @param interval Interval in milliseconds
 * @returns Promise that resolves to whether the request is allowed
 */
export async function isRateLimited(
  key: string,
  tokensPerInterval: number = 10,
  interval: number = 60000 // Default: 10 requests per minute
): Promise<boolean> {
  const limiter = getRateLimiter(key, tokensPerInterval, interval);
  
  try {
    await limiter.removeTokens(1);
    return false; // Not rate limited
  } catch (error) {
    return true; // Rate limited
  }
}

/**
 * Gets the remaining tokens for a rate limiter
 * @param key Key for the rate limiter (e.g., IP address, user ID)
 * @param tokensPerInterval Number of allowed requests per interval
 * @param interval Interval in milliseconds
 * @returns Promise that resolves to the number of remaining tokens
 */
export async function getRemainingTokens(
  key: string,
  tokensPerInterval: number = 10,
  interval: number = 60000
): Promise<number> {
  const limiter = getRateLimiter(key, tokensPerInterval, interval);
  return limiter.getTokensRemaining();
}

/**
 * Common rate limiting presets
 */
export const RateLimitPresets = {
  // Login attempts: 5 per minute
  LOGIN: {
    tokensPerInterval: 5,
    interval: 60000,
  },
  
  // API requests: 60 per minute
  API_STANDARD: {
    tokensPerInterval: 60,
    interval: 60000,
  },
  
  // Health record operations: 30 per minute
  HEALTH_RECORD_OPS: {
    tokensPerInterval: 30,
    interval: 60000,
  },
  
  // Document uploads: 10 per minute
  DOCUMENT_UPLOAD: {
    tokensPerInterval: 10,
    interval: 60000,
  },
  
  // AI interactions: 5 per minute
  AI_INTERACTIONS: {
    tokensPerInterval: 5,
    interval: 60000,
  },
};
