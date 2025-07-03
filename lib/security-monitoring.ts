import { prisma } from "./prisma";
import { getClientIp } from "./api-middleware";
import { createAuditLog } from "./audit";
import { NextRequest } from "next/server";

// IP addresses that have been flagged for suspicious activity
const suspiciousIPs = new Map<string, { count: number; lastDetectedAt: Date }>();

// Track failed login attempts by IP
const failedLoginsByIP = new Map<string, { count: number; firstAttemptAt: Date }>();

// Track failed login attempts by username/email
const failedLoginsByUsername = new Map<string, { count: number; firstAttemptAt: Date }>();

/**
 * Check if an IP is currently on the suspicious list
 */
export function isIPSuspicious(ip: string): boolean {
  return suspiciousIPs.has(ip);
}

/**
 * Record a security event
 */
export async function recordSecurityEvent({
  eventType,
  userId,
  email,
  ip,
  userAgent,
  details,
  request,
  severity = "medium",
}: {
  eventType: "failed_login" | "suspicious_activity" | "brute_force_attempt" | "vulnerability_attempt";
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  request?: NextRequest;
  severity?: "low" | "medium" | "high" | "critical";
}) {
  // Extract IP and user agent from request if provided
  if (request) {
    ip = ip || getClientIp(request);
    userAgent = userAgent || request.headers.get("user-agent") || undefined;
  }

  // Determine severity based on event type if not provided
  if (!severity) {
    if (eventType === "brute_force_attempt" || eventType === "vulnerability_attempt") {
      severity = "high";
    } else if (eventType === "suspicious_activity") {
      severity = "medium";
    } else {
      severity = "low";
    }
  }

  // Create security event record in database
  try {
    await prisma.securityEvent.create({
      data: {
        eventType,
        userId,
        email,
        ipAddress: ip,
        userAgent,
        details: details ? JSON.stringify(details) : undefined,
        severity,
      },
    });

    // Create audit log if we have a user ID
    if (userId) {
      await createAuditLog({
        userId,
        action: "system_alert",
        resourceType: "security",
        description: `Security event: ${eventType}`,
        ipAddress: ip,
        userAgent,
      });
    }
  } catch (error) {
    console.error("Failed to record security event:", error);
  }

  // Handle specific security events
  if (eventType === "failed_login" && ip && email) {
    recordFailedLoginAttempt(ip, email);
  } else if (eventType === "suspicious_activity" && ip) {
    flagSuspiciousIP(ip);
  }
}

/**
 * Record a failed login attempt and detect brute force attacks
 */
function recordFailedLoginAttempt(ip: string, username: string): boolean {
  const now = new Date();
  const THRESHOLD = 5; // Number of attempts that triggers detection
  const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes
  
  // Track by IP
  if (!failedLoginsByIP.has(ip)) {
    failedLoginsByIP.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    const data = failedLoginsByIP.get(ip)!;
    
    // Check if we're within the time window
    if (now.getTime() - data.firstAttemptAt.getTime() > TIME_WINDOW) {
      // Reset if outside the window
      failedLoginsByIP.set(ip, { count: 1, firstAttemptAt: now });
    } else {
      // Increment if inside the window
      data.count++;
      failedLoginsByIP.set(ip, data);
      
      // Check if we've hit the threshold
      if (data.count >= THRESHOLD) {
        flagSuspiciousIP(ip);
        return true;
      }
    }
  }
  
  // Track by username
  if (!failedLoginsByUsername.has(username)) {
    failedLoginsByUsername.set(username, { count: 1, firstAttemptAt: now });
  } else {
    const data = failedLoginsByUsername.get(username)!;
    
    // Check if we're within the time window
    if (now.getTime() - data.firstAttemptAt.getTime() > TIME_WINDOW) {
      // Reset if outside the window
      failedLoginsByUsername.set(username, { count: 1, firstAttemptAt: now });
    } else {
      // Increment if inside the window
      data.count++;
      failedLoginsByUsername.set(username, data);
    }
  }
  
  return false;
}

/**
 * Flag an IP as suspicious
 */
function flagSuspiciousIP(ip: string) {
  const now = new Date();
  
  if (!suspiciousIPs.has(ip)) {
    suspiciousIPs.set(ip, { count: 1, lastDetectedAt: now });
  } else {
    const data = suspiciousIPs.get(ip)!;
    data.count++;
    data.lastDetectedAt = now;
    suspiciousIPs.set(ip, data);
  }
}

/**
 * Clean up old entries in tracking maps
 * Should be called periodically (e.g., by a cron job)
 */
export function cleanupSecurityTracking() {
  const now = new Date();
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Clean up failed login attempts (3-hour window)
  failedLoginsByIP.forEach((data, ip) => {
    if (now.getTime() - data.firstAttemptAt.getTime() > THREE_HOURS) {
      failedLoginsByIP.delete(ip);
    }
  });
  
  failedLoginsByUsername.forEach((data, username) => {
    if (now.getTime() - data.firstAttemptAt.getTime() > THREE_HOURS) {
      failedLoginsByUsername.delete(username);
    }
  });
  
  // Clean up suspicious IPs (24-hour window)
  suspiciousIPs.forEach((data, ip) => {
    if (now.getTime() - data.lastDetectedAt.getTime() > ONE_DAY) {
      suspiciousIPs.delete(ip);
    }
  });
}
