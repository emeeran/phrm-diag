import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AIChat from "@/components/dashboard/ai-chat";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart, Settings } from "lucide-react";

export default async function AIChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">AI Health Assistant</h1>
          <div className="flex space-x-2">
            <Link href="/dashboard/ai/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Link href="/dashboard/ai/stats">
              <Button variant="outline" size="sm">
                <BarChart className="h-4 w-4 mr-2" />
                Usage Stats
              </Button>
            </Link>
          </div>
        </div>
        <AIChat user={{
          email: session.user.email as string,
          name: session.user.name || undefined
        }} />
      </div>
    </div>
  );
}
