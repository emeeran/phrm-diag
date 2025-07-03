import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createProtectedHandler } from "@/lib/api-middleware";

export const GET = createProtectedHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id as string;
    const exportId = params.id;
    
    try {
      // Get the export request
      const exportRequest = await prisma.dataExport.findUnique({
        where: { id: exportId },
        include: { user: { select: { id: true } } },
      });
      
      // Check if the export exists and belongs to the user
      if (!exportRequest || exportRequest.userId !== userId) {
        return new NextResponse(
          JSON.stringify({ error: "Export not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Check if the export is completed
      if (exportRequest.status !== "completed") {
        return new NextResponse(
          JSON.stringify({ 
            error: "Export is not ready for download", 
            status: exportRequest.status 
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Check if the export has expired
      if (exportRequest.expiresAt && new Date() > exportRequest.expiresAt) {
        return new NextResponse(
          JSON.stringify({ error: "Export link has expired" }),
          { status: 410, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // In a real application, we would:
      // 1. Generate the data export file if it doesn't exist
      // 2. Return the file as a download or a signed URL to the file
      
      // For this demo, we'll generate a sample export file
      const userData = await getUserDataForExport(userId, {
        includeHealthRecords: exportRequest.includesHealthRecords,
        includeDocuments: exportRequest.includesDocuments,
        includeAiInteractions: exportRequest.includesAiInteractions,
      });
      
      // Create audit log for the download
      await createAuditLog({
        userId,
        action: "download",
        resourceType: "data_export",
        resourceId: exportId,
        description: "User downloaded data export",
      });
      
      // Return the data as a JSON download
      return new NextResponse(
        JSON.stringify(userData, null, 2),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="phrm-data-export-${new Date().toISOString().split('T')[0]}.json"`
          }
        }
      );
    } catch (error) {
      console.error("Error downloading data export:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to download data export" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);

// Simplified version of the data export function for demo purposes
async function getUserDataForExport(userId: string, options: {
  includeHealthRecords: boolean;
  includeDocuments: boolean;
  includeAiInteractions: boolean;
}) {
  const { includeHealthRecords, includeDocuments, includeAiInteractions } = options;
  
  // Get base user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      marketingConsent: true,
      analyticsConsent: true,
      aiProcessingConsent: true,
      dataRetentionPeriod: true,
    },
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Build the export data
  const exportData: any = {
    user,
    exportDate: new Date().toISOString(),
    exportVersion: "1.0",
  };
  
  // Get health records if requested
  if (includeHealthRecords) {
    exportData.healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  
  // Get documents if requested (only metadata, not the actual files)
  if (includeDocuments) {
    // Get all health record IDs first
    const healthRecordIds = includeHealthRecords ? 
      exportData.healthRecords.map((r: any) => r.id) :
      await prisma.healthRecord.findMany({
        where: { userId },
        select: { id: true },
      }).then(records => records.map(r => r.id));
    
    // Then get documents for those health records
    exportData.documents = await prisma.document.findMany({
      where: { healthRecordId: { in: healthRecordIds } },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        url: true,
        createdAt: true,
        healthRecordId: true,
      }
    });
  }
  
  // Get AI interactions if requested
  if (includeAiInteractions) {
    exportData.aiInteractions = await prisma.aIInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        query: true,
        response: true,
        modelUsed: true,
        complexity: true,
        createdAt: true,
        // Excluding cost and token data for privacy
      }
    });
  }
  
  return exportData;
}
