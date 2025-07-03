import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createProtectedHandler } from "@/lib/api-middleware";

// GET endpoint to retrieve user's data export requests
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

    const userId = session.user.id as string;
    
    try {
      // Get all export requests for the user
      const exports = await prisma.dataExport.findMany({
        where: { userId },
        orderBy: { requestedAt: "desc" },
      });
      
      return new NextResponse(
        JSON.stringify({ exports }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching data exports:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch data exports" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);

export const POST = createProtectedHandler(
  async (req: NextRequest) => {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id as string;
    
    try {
      // Check for existing recent export requests to prevent abuse
      const existingRequest = await prisma.dataExport.findFirst({
        where: {
          userId,
          requestedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
          status: { in: ["requested", "processing"] },
        },
      });
      
      if (existingRequest) {
        return new NextResponse(
          JSON.stringify({
            error: "You already have a pending export request. Please wait for it to complete.",
            requestId: existingRequest.id,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Parse request body for export options
      const body = await req.json().catch(() => ({}));
      const { 
        format = "json", 
        includeHealthRecords = true,
        includeDocuments = true,
        includeAiInteractions = true
      } = body;
      
      // Create new export request
      const exportRequest = await prisma.dataExport.create({
        data: {
          userId,
          status: "requested",
          format,
          includesHealthRecords: includeHealthRecords,
          includesDocuments: includeDocuments,
          includesAiInteractions: includeAiInteractions,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
      
      // Create audit log
      await createAuditLog({
        userId,
        action: "user_updated",
        resourceType: "user",
        resourceId: userId,
        description: "User requested data export",
      });
      
      // In a real application, we would trigger a background job here to process the export
      // For now, we'll just return the request ID
      
      return new NextResponse(
        JSON.stringify({
          success: true,
          message: "Data export requested successfully. You will receive an email when it's ready.",
          requestId: exportRequest.id,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error requesting data export:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to request data export" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true, rateLimitOptions: { tokensPerInterval: 5, interval: 3600000 } } // Limit to 5 requests per hour
);
