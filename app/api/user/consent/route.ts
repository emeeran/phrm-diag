import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
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

    const { id: userId } = session.user;
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          marketingConsent: true,
          analyticsConsent: true,
          aiProcessingConsent: true,
          dataRetentionPeriod: true,
          consentSettings: true,
          lastConsentUpdate: true,
        },
      });
      
      if (!user) {
        return new NextResponse(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Parse additional consent settings from JSON if available
      let additionalConsents = {};
      if (user.consentSettings) {
        try {
          additionalConsents = JSON.parse(user.consentSettings);
        } catch (e) {
          console.error("Error parsing consent settings:", e);
        }
      }
      
      // Combine all consent settings
      const consents = {
        marketingConsent: user.marketingConsent,
        analyticsConsent: user.analyticsConsent,
        aiProcessingConsent: user.aiProcessingConsent,
        dataRetentionPeriod: user.dataRetentionPeriod || "3years",
        thirdPartyConsent: false,
        locationConsent: false,
        healthDataSharing: false,
        ...additionalConsents,
      };
      
      return new NextResponse(
        JSON.stringify({
          consents,
          lastUpdated: user.lastConsentUpdate,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching user consent settings:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch consent settings" }),
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

    const { id: userId } = session.user;
    
    try {
      const body = await req.json();
      const { consents } = body;
      
      if (!consents) {
        return new NextResponse(
          JSON.stringify({ error: "Consent settings are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Extract core consent fields
      const {
        marketingConsent,
        analyticsConsent,
        aiProcessingConsent,
        dataRetentionPeriod,
        ...additionalConsents
      } = consents;
      
      // Update user consent settings
      await prisma.user.update({
        where: { id: userId },
        data: {
          marketingConsent: marketingConsent || false,
          analyticsConsent: analyticsConsent || false,
          aiProcessingConsent: aiProcessingConsent !== undefined ? aiProcessingConsent : true,
          dataRetentionPeriod: dataRetentionPeriod || "3years",
          consentSettings: JSON.stringify(additionalConsents),
          lastConsentUpdate: new Date(),
        },
      });
      
      // Create audit log
      await createAuditLog({
        userId,
        action: "user_updated",
        resourceType: "user",
        resourceId: userId,
        description: "User updated consent settings",
      });
      
      return new NextResponse(
        JSON.stringify({ 
          success: true,
          message: "Consent settings updated successfully" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating user consent settings:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to update consent settings" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);
