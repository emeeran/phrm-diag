import { prisma } from "./prisma";

/**
 * Process a data export request
 * 
 * @param requestId The ID of the data export request
 * @returns Promise<string> The URL to the exported data file
 */
export async function processDataExport(requestId: string): Promise<string> {
  try {
    // Get the export request
    const exportRequest = await prisma.dataExport.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    
    if (!exportRequest) {
      throw new Error("Export request not found");
    }
    
    // Update status to processing
    await prisma.dataExport.update({
      where: { id: requestId },
      data: { status: "processing" },
    });
    
    // Get user data
    const userData = await getUserData(
      exportRequest.userId,
      {
        includeHealthRecords: exportRequest.includesHealthRecords,
        includeDocuments: exportRequest.includesDocuments,
        includeAiInteractions: exportRequest.includesAiInteractions,
      }
    );
    
    // In a real application, we would:
    // 1. Generate a file (JSON, CSV, etc.)
    // 2. Upload it to secure storage (S3, etc.)
    // 3. Create a signed URL with an expiration
    
    // For this demo, we'll simulate the process
    const fileUrl = `/api/user/data-export/${requestId}/download`;
    
    // Update the export request with the file URL and completion info
    await prisma.dataExport.update({
      where: { id: requestId },
      data: {
        status: "completed",
        fileUrl,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });
    
    return fileUrl;
  } catch (error) {
    console.error("Error processing data export:", error);
    
    // Update the export request with the failure
    await prisma.dataExport.update({
      where: { id: requestId },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });
    
    throw error;
  }
}

/**
 * Get all relevant user data for export
 */
async function getUserData(userId: string, options: {
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
  const exportData = {
    user,
    healthRecords: [],
    documents: [],
    aiInteractions: [],
    healthAnalyses: [],
    emergencyContacts: [],
    familyMembers: [],
  };
  
  // Get health records if requested
  if (includeHealthRecords) {
    exportData.healthRecords = await prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    
    exportData.emergencyContacts = await prisma.emergencyContact.findMany({
      where: { userId },
    });
    
    exportData.familyMembers = await prisma.familyMember.findMany({
      where: { OR: [{ primaryUserId: userId }, { memberUserId: userId }] },
      include: {
        primaryUser: { select: { name: true, email: true } },
        member: { select: { name: true, email: true } },
      },
    });
    
    exportData.healthAnalyses = await prisma.healthAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  
  // Get documents if requested
  if (includeDocuments) {
    // Get all health record IDs first
    const healthRecordIds = await prisma.healthRecord.findMany({
      where: { userId },
      select: { id: true },
    }).then(records => records.map(r => r.id));
    
    // Then get documents for those health records
    exportData.documents = await prisma.document.findMany({
      where: { healthRecordId: { in: healthRecordIds } },
    });
  }
  
  // Get AI interactions if requested
  if (includeAiInteractions) {
    exportData.aiInteractions = await prisma.aIInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  
  return exportData;
}
