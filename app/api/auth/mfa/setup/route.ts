import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateMfaSecret } from "@/lib/mfa";
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

    // Get the user's email and ID
    const { email, id: userId } = session.user;

    try {
      // Generate a new MFA secret for the user
      const { secret, qrCodeUrl, backupCodes } = await generateMfaSecret(
        userId,
        email as string
      );

      // Create audit log
      await createAuditLog({
        userId,
        action: "mfa_setup",
        resourceType: "user",
        resourceId: userId,
        description: "MFA setup initiated",
      });

      return new NextResponse(
        JSON.stringify({ 
          success: true,
          secret,
          qrCodeUrl,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("MFA setup error:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to setup MFA" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true, rateLimitOptions: { tokensPerInterval: 5, interval: 60000 } }
);
