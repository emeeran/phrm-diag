import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { HealthInsights } from "@/components/dashboard/health-insights"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardOverview user={session.user || {}} />
        </div>
        <div className="lg:col-span-1">
          <HealthInsights />
        </div>
      </div>
    </div>
  )
}
