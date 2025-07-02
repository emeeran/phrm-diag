import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AIUsageStats } from "@/components/dashboard/ai-usage-stats";
import { AISettings } from "@/components/dashboard/ai-settings";

export default async function AISettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">AI Assistant Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AISettings />
        </div>
        <div className="lg:col-span-2">
          <AIUsageStats />
        </div>
      </div>
    </div>
  );
}
