import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FamilyManagement from "@/components/dashboard/family/family-management";
import FamilyNavigation from "@/components/dashboard/family/family-navigation";

export default async function FamilyPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Family Health Management</h1>
        <FamilyNavigation />
        <p className="text-gray-600 mb-6">
          Manage your family members and control what health information they can access.
          Invite family members to join and set specific permission levels for their access.
        </p>
        
        <FamilyManagement userEmail={session.user?.email as string} />
      </div>
    </div>
  );
}
