import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FamilyHealthTimeline from "@/components/dashboard/family/family-health-timeline";
import FamilyNavigation from "@/components/dashboard/family/family-navigation";

export default async function FamilyTimelinePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Family Health Timeline</h1>
        <FamilyNavigation />
        <FamilyHealthTimeline />
      </div>
    </div>
  );
}
