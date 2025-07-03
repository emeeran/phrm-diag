import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSessions, revokeSession, revokeAllSessions } from "@/lib/session-management";
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
      // Get the user's sessions
      const sessions = await getUserSessions(userId);
      
      return new NextResponse(
        JSON.stringify({ sessions }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch sessions" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);

export const DELETE = createProtectedHandler(
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
      // Check if we're deleting a specific session or all sessions
      const { searchParams } = new URL(req.url);
      const sessionToken = searchParams.get("sessionToken");
      
      if (sessionToken) {
        // Delete a specific session
        await revokeSession(sessionToken, userId);
        
        return new NextResponse(
          JSON.stringify({ success: true, message: "Session revoked" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        // Delete all sessions except the current one
        const currentSessionToken = session.user.sessionToken || "";
        const count = await revokeAllSessions(userId, currentSessionToken);
        
        return new NextResponse(
          JSON.stringify({ 
            success: true, 
            message: `${count} sessions revoked` 
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (error) {
      console.error("Error revoking session(s):", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to revoke session(s)" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);
