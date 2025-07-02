import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthTrendsAnalysis } from "@/components/dashboard/health-analysis/health-trends-analysis";
import { MedicationInteractionChecker } from "@/components/dashboard/health-analysis/medication-interaction-checker";

export default async function HealthAnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Health Analysis</h1>
      
      <Tabs defaultValue="trends">
        <TabsList className="mb-6">
          <TabsTrigger value="trends">Health Trends</TabsTrigger>
          <TabsTrigger value="medications">Medication Interactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <HealthTrendsAnalysis />
        </TabsContent>
        
        <TabsContent value="medications">
          <MedicationInteractionChecker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
