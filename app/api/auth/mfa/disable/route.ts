import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { disableMfa } from "@/lib/mfa";
import { createAuditLog } from "@/lib/audit";
import { createProtectedHandler } from "@/lib/api-middleware";

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

    // Get the user ID
    const { id: userId } = session.user;
    
    try {
      // Get verification from the request body
      const body = await req.json();
      const { verificationCode } = body;
      
      if (!verificationCode) {
        return new NextResponse(
          JSON.stringify({ error: "Verification code is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Additional verification logic could be added here
      // For example, requiring a password re-entry or a recent authentication
      
      // Disable MFA for the user
      await disableMfa(userId);
      
      // Create audit log
      await createAuditLog({
        userId,
        action: "mfa_disable",
        resourceType: "user",
        resourceId: userId,
        description: "MFA disabled",
      });
      
      return new NextResponse(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("MFA disable error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to disable MFA" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true, rateLimitOptions: { tokensPerInterval: 5, interval: 60000 } }
);
