import { prisma } from "./prisma";
import { getClientIp } from "./api-middleware";
import { NextRequest } from "next/server";
import { createAuditLog } from "./audit";

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: {
      userId,
    },
    orderBy: {
      expires: "desc",
    },
  });
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionToken: string, userId: string) {
  await prisma.session.delete({
    where: {
      sessionToken,
    },
  });
  
  await createAuditLog({
    userId,
    action: "logout",
    resourceType: "session",
    resourceId: sessionToken,
    description: "Session revoked",
  });
}

/**
 * Revoke all sessions for a user except the current one
 */
export async function revokeAllSessions(userId: string, currentSessionToken: string) {
  const { count } = await prisma.session.deleteMany({
    where: {
      userId,
      sessionToken: {
        not: currentSessionToken,
      },
    },
  });
  
  await createAuditLog({
    userId,
    action: "logout",
    resourceType: "session",
    description: `All other sessions revoked (${count} sessions)`,
  });
  
  return count;
}

/**
 * Update session information on login
 */
export async function updateSessionInfo(
  userId: string,
  sessionToken: string,
  request: NextRequest
) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || undefined;
  
  // Update user's login info
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
      failedLoginAttempts: 0, // Reset failed attempts on successful login
    },
  });
  
  // Update session with additional metadata if needed
  // This could be extended to store device info, location, etc.
  
  // Create audit log
  await createAuditLog({
    userId,
    action: "login",
    resourceType: "session",
    resourceId: sessionToken,
    description: "User logged in",
    ipAddress: clientIp,
    userAgent,
  });
}

/**
 * Check if a session should be expired due to inactivity
 */
export async function checkSessionActivity(
  sessionToken: string,
  maxInactivityMinutes: number = 30
) {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
  });
  
  if (!session) {
    return false; // Session doesn't exist
  }
  
  const now = new Date();
  const expiresAt = new Date(session.expires);
  const inactivityThreshold = new Date(now.getTime() - maxInactivityMinutes * 60000);
  
  // If the session will expire soon due to inactivity, return true
  return expiresAt < inactivityThreshold;
}
