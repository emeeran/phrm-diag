import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Get the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Add security headers
  
  // Protect against XSS attacks
  response.headers.set("Content-Security-Policy", 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.com https://vercel.live; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.amazonaws.com; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.openai.com https://vercel.com https://vercel.live; " +
    "media-src 'self'; " +
    "object-src 'none'; " +
    "frame-ancestors 'self'; " +
    "form-action 'self'; " +
    "base-uri 'self';"
  );
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  
  // Enable browser XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Control browser features
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), interest-cohort=()");
  
  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // HSTS (HTTP Strict Transport Security)
  // Only enable in production, and be careful with this as it's hard to revert
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  
  return response;
}
