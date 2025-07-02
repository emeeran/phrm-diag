import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AIUsageStats } from "@/components/dashboard/ai-usage-stats";

export default async function AIStatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI Usage Statistics</h1>
        <AIUsageStats />
      </div>
    </div>
  );
}
