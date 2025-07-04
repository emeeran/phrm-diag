import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createProtectedHandler } from "@/lib/api-middleware";

// GET - retrieve security events
export const GET = createProtectedHandler(
  async (req: NextRequest) => {
    // Ensure user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = (session.user as any)?.id || session.user?.email as string;
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    // Only allow admins to access security events
    if (!user || user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    
    try {
      // Parse query parameters
      const url = new URL(req.url);
      const severity = url.searchParams.get("severity");
      const eventType = url.searchParams.get("eventType");
      const resolved = url.searchParams.get("resolved");
      const limit = parseInt(url.searchParams.get("limit") || "100");
      
      // Build filter conditions
      const where: any = {};
      
      if (severity) {
        where.severity = severity;
      }
      
      if (eventType) {
        where.eventType = eventType;
      }
      
      if (resolved !== null) {
        where.resolved = resolved === "true";
      }
      
      // Get security events
      const events = await prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      // Create audit log for the request
      await createAuditLog({
        userId,
        action: "record_updated",
        resourceType: "system",
        description: "Admin viewed security events",
      });
      
      return new NextResponse(
        JSON.stringify({ events }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching security events:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch security events" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);
