import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { createProtectedHandler } from "@/lib/api-middleware";

// PATCH - update a security event
export const PATCH = createProtectedHandler(
  async (req: NextRequest, context: { params: Record<string, string> }) => {
    const { params } = context;
    const id = params.id;
    
    // Ensure user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = (session.user as any).id as string;
    const eventId = params.id;
    
    // Check if the user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    // Only allow admins to update security events
    if (!user || user.role !== "ADMIN") {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    
    try {
      // Parse request body
      const body = await req.json();
      const { resolved, notes } = body;
      
      // Check if the event exists
      const event = await prisma.securityEvent.findUnique({
        where: { id: eventId },
      });
      
      if (!event) {
        return new NextResponse(
          JSON.stringify({ error: "Security event not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Update the security event
      const updatedEvent = await prisma.securityEvent.update({
        where: { id: eventId },
        data: {
          resolved: resolved !== undefined ? resolved : event.resolved,
          notes: notes || event.notes,
          resolvedById: resolved ? userId : undefined,
          resolvedAt: resolved ? new Date() : undefined,
        },
      });
      
      // Create audit log for the update
      await createAuditLog({
        userId,
        action: "record_updated",
        resourceType: "system",
        resourceId: eventId,
        description: resolved ? "Admin marked security event as resolved" : "Admin updated security event",
      });
      
      return new NextResponse(
        JSON.stringify({ event: updatedEvent }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating security event:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to update security event" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
  { requireAuth: true }
);
