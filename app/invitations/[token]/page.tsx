import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import InvitationAccept from "@/components/dashboard/family/invitation-accept";

export default async function AcceptInvitationPage({ 
  params 
}: { 
  params: { token: string } 
}) {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect(`/auth/login?callbackUrl=/invitations/${params.token}`);
  }
  
  return (
    <div className="container max-w-lg mx-auto px-4 py-16">
      <InvitationAccept inviteToken={params.token} />
    </div>
  );
}
