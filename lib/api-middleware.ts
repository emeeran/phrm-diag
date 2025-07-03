import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, RateLimitPresets } from "./rate-limit";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import DOMPurify from "isomorphic-dompurify";

/**
 * Get the client IP address from a request
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  return request.ip || "127.0.0.1";
}

/**
 * Sanitize an object's string values to prevent XSS
 */
export function sanitizeObject<T extends object>(obj: T): T {
  const sanitized = { ...obj };
  
  Object.keys(sanitized).forEach((key) => {
    const value = (sanitized as any)[key];
    
    if (typeof value === "string") {
      (sanitized as any)[key] = DOMPurify.sanitize(value);
    } else if (typeof value === "object" && value !== null) {
      (sanitized as any)[key] = sanitizeObject(value);
    }
  });
  
  return sanitized;
}

/**
 * API Route Handler Wrapper with rate limiting and input sanitization
 */
export function createProtectedHandler(
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> }
  ) => Promise<NextResponse>,
  options?: {
    rateLimitKey?: (req: NextRequest) => string;
    rateLimitOptions?: {
      tokensPerInterval: number;
      interval: number;
    };
    requireAuth?: boolean;
  }
) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ) => {
    const clientIp = getClientIp(req);
    
    // Apply rate limiting
    const rateLimitKey = options?.rateLimitKey
      ? options.rateLimitKey(req)
      : `ip:${clientIp}:${req.nextUrl.pathname}`;
    
    const rateLimitOptions = options?.rateLimitOptions || RateLimitPresets.API_STANDARD;
    
    const isLimited = await isRateLimited(
      rateLimitKey,
      rateLimitOptions.tokensPerInterval,
      rateLimitOptions.interval
    );
    
    if (isLimited) {
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": (rateLimitOptions.interval / 1000).toString(),
          },
        }
      );
    }
    
    // Check authentication if required
    if (options?.requireAuth) {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return new NextResponse(
          JSON.stringify({
            error: "Authentication required.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
    
    // Handle the request
    try {
      // If this is a POST, PUT, or PATCH request with a JSON body, sanitize the input
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        try {
          const contentType = req.headers.get("content-type");
          
          if (contentType?.includes("application/json")) {
            const originalBody = await req.json();
            const sanitizedBody = sanitizeObject(originalBody);
            
            // Create a new request with the sanitized body
            const sanitizedReq = new NextRequest(req.url, {
              method: req.method,
              headers: req.headers,
              body: JSON.stringify(sanitizedBody),
            });
            
            return handler(sanitizedReq, context);
          }
        } catch (error) {
          // If parsing fails, continue with the original request
          console.error("Error sanitizing request body:", error);
        }
      }
      
      return handler(req, context);
    } catch (error) {
      console.error("Error in API route:", error);
      
      return new NextResponse(
        JSON.stringify({
          error: "Internal server error.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}
