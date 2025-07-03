import { prisma } from "@/lib/prisma";
import { sendEmail } from "./send-email";

interface NotificationOptions {
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "reminder";
  userId: string;
  relatedRecordId?: string;
  sendEmail?: boolean;
}

/**
 * Create a notification and optionally send an email
 */
export async function createNotification({
  title,
  message,
  type,
  userId,
  relatedRecordId,
  sendEmail = false
}: NotificationOptions) {
  try {
    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        relatedRecordId
      }
    });
    
    // Send email if specified
    if (sendEmail) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: title,
          text: message
        });
      }
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for all family members with given permissions
 */
export async function notifyFamilyMembers({
  fromUserId,
  title,
  message,
  type,
  permissionLevels = ["edit", "admin"],
  relatedRecordId,
  sendEmails = false
}: {
  fromUserId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "reminder";
  permissionLevels?: string[];
  relatedRecordId?: string;
  sendEmails?: boolean;
}) {
  try {
    // Find all family members with the specified permission levels
    const familyMembers = await prisma.familyMember.findMany({
      where: {
        primaryUserId: fromUserId,
        permission: { in: permissionLevels }
      },
      include: {
        member: true
      }
    });
    
    // Create notifications for each family member
    const notifications = await Promise.all(
      familyMembers.map(async (familyMember) => {
        return createNotification({
          title,
          message,
          type,
          userId: familyMember.memberUserId,
          relatedRecordId,
          sendEmail: sendEmails
        });
      })
    );
    
    return notifications;
  } catch (error) {
    console.error("Error notifying family members:", error);
    throw error;
  }
}

/**
 * Send a medication reminder to a user and their family members with admin permission
 */
export async function sendMedicationReminder({
  userId,
  medicationName,
  scheduledTime,
  instructions
}: {
  userId: string;
  medicationName: string;
  scheduledTime: Date;
  instructions?: string;
}) {
  try {
    // Format time
    const formattedTime = scheduledTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Notification for the user
    await createNotification({
      title: `Time to take ${medicationName}`,
      message: `Reminder to take ${medicationName} at ${formattedTime}${instructions ? `. ${instructions}` : ''}`,
      type: "reminder",
      userId,
      sendEmail: true
    });
    
    // Notification for family members with admin permission
    await notifyFamilyMembers({
      fromUserId: userId,
      title: `Medication Reminder for Family Member`,
      message: `Reminder: A family member needs to take ${medicationName} at ${formattedTime}`,
      type: "info",
      permissionLevels: ["admin"],
      sendEmails: false
    });
  } catch (error) {
    console.error("Error sending medication reminder:", error);
    throw error;
  }
}

/**
 * Send an emergency alert to all family members
 */
export async function sendEmergencyAlert({
  fromUserId,
  message,
  location
}: {
  fromUserId: string;
  message: string;
  location?: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { name: true, email: true }
    });
    
    const userName = user?.name || user?.email || "A family member";
    
    // Alert for all family members regardless of permission level
    await notifyFamilyMembers({
      fromUserId,
      title: "EMERGENCY ALERT",
      message: `${userName} has triggered an emergency alert: ${message}${location ? ` Location: ${location}` : ''}`,
      type: "alert",
      permissionLevels: ["view", "edit", "admin"],
      sendEmails: true
    });
  } catch (error) {
    console.error("Error sending emergency alert:", error);
    throw error;
  }
}
