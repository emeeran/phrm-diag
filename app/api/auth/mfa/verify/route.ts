import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyMfaToken, enableMfa } from "@/lib/mfa";
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
      // Get the token from the request body
      const body = await req.json();
      const { token } = body;
      
      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: "Verification token is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Verify the token
      const isValid = await verifyMfaToken(userId, token);
      
      if (!isValid) {
        // Create audit log for failed verification
        await createAuditLog({
          userId,
          action: "mfa_verify",
          resourceType: "user",
          resourceId: userId,
          description: "MFA verification failed",
        });
        
        return new NextResponse(
          JSON.stringify({ error: "Invalid verification token" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Create audit log for successful verification
      await createAuditLog({
        userId,
        action: "mfa_verify",
        resourceType: "user",
        resourceId: userId,
        description: "MFA verification successful",
      });
      
      return new NextResponse(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("MFA verification error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to verify MFA token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true, rateLimitOptions: { tokensPerInterval: 10, interval: 60000 } }
);
