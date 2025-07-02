import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto px-4 py-8">
        <DashboardOverview user={session.user} />
      </main>
    </div>
  )
}
