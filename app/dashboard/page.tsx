import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { HealthInsights } from "@/components/dashboard/health-insights"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart2, 
  Sparkles,
  Bell,
  ArrowRight,
  Activity,
  FileText,
  Calendar,
  Shield
} from "lucide-react"

async function getPredictiveInsights() {
  // This would normally fetch from the API, but we'll simulate for the server component
  return {
    riskCount: 3,
    recommendationCount: 5,
    totalCount: 12
  }
}

async function getAlerts() {
  // This would normally fetch from the API, but we'll simulate for the server component
  return {
    urgentCount: 2,
    totalCount: 7
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Get insights and alerts data
  const insights = await getPredictiveInsights()
  const alerts = await getAlerts()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardOverview user={session.user || {}} />
          
          {/* New Predictive Features Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Predictive Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/predictive" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                        Health Predictions
                      </CardTitle>
                      <Badge>{insights.totalCount}</Badge>
                    </div>
                    <CardDescription>AI-powered health risk predictions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span>Health risks</span>
                        <Badge variant="outline">{insights.riskCount}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Recommendations</span>
                        <Badge variant="outline">{insights.recommendationCount}</Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" className="w-full">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/alerts" className="block">
                <Card className="h-full hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <Bell className="h-5 w-5 mr-2 text-amber-500" />
                        Smart Alerts
                      </CardTitle>
                      <Badge variant={alerts.urgentCount > 0 ? "destructive" : "default"}>
                        {alerts.totalCount}
                      </Badge>
                    </div>
                    <CardDescription>Personalized health alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span>Urgent alerts</span>
                        <Badge variant={alerts.urgentCount > 0 ? "destructive" : "outline"}>
                          {alerts.urgentCount}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>All alerts</span>
                        <Badge variant="outline">{alerts.totalCount}</Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" className="w-full">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <HealthInsights />
          
          {/* Quick Access Section */}
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">
              Quick Access
            </h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Health Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/records">
                  <FileText className="mr-2 h-4 w-4" />
                  Health Records
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/family">
                  <Calendar className="mr-2 h-4 w-4" />
                  Family Calendar
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/security">
                  <Shield className="mr-2 h-4 w-4" />
                  Security Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
