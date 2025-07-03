import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enableMfa } from "@/lib/mfa";
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
      // Enable MFA for the user
      await enableMfa(userId);
      
      // Create audit log
      await createAuditLog({
        userId,
        action: "mfa_setup",
        resourceType: "user",
        resourceId: userId,
        description: "MFA successfully enabled",
      });
      
      return new NextResponse(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("MFA enable error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to enable MFA" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true, rateLimitOptions: { tokensPerInterval: 5, interval: 60000 } }
);
