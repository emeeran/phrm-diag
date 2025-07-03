import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProtectedHandler } from "@/lib/api-middleware";

export const GET = createProtectedHandler(
  async (req: NextRequest) => {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the user ID
    const { id: userId } = session.user;
    
    try {
      // Get the user's security settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          mfaEnabled: true,
          lastLoginAt: true,
          lastLoginIp: true,
        },
      });
      
      if (!user) {
        return new NextResponse(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Get recent login activity
      const recentLogins = await prisma.auditLog.findMany({
        where: {
          userId,
          action: "login",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          createdAt: true,
          ipAddress: true,
          userAgent: true,
        },
      });
      
      return new NextResponse(
        JSON.stringify({
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLoginAt,
          lastLoginIp: user.lastLoginIp,
          recentLogins,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching security settings:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch security settings" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);
