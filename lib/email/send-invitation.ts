// Create a utility file for sending emails
// In a production app, you would integrate with an email service like SendGrid, AWS SES, etc.

interface SendInvitationEmailParams {
  to: string;
  fromName: string;
  invitationLink: string;
  permission: string;
}

export async function sendInvitationEmail({ 
  to, 
  fromName, 
  invitationLink,
  permission
}: SendInvitationEmailParams): Promise<void> {
  // This is a mock function - in a real app, you would send an actual email
  console.log(`
    To: ${to}
    From: PHRM-Diag (on behalf of ${fromName})
    Subject: You've been invited to join a family health group
    
    Body:
    ${fromName} has invited you to join their family health group on PHRM-Diag.
    
    You've been granted ${permission} access to their health records.
    
    Click the link below to accept the invitation:
    ${invitationLink}
    
    This invitation will expire in 7 days.
  `);
  
  // In a real application, you would send an actual email
  return Promise.resolve();
}
