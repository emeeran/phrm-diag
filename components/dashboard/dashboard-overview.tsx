import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, FileText, MessageSquare, Plus, Users } from "lucide-react"
import Link from "next/link"

interface DashboardOverviewProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your health management dashboard.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Add Record</CardTitle>
            </div>
            <CardDescription>
              Create a new health record
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">AI Chat</CardTitle>
            </div>
            <CardDescription>
              Ask questions about your health
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Upload Document</CardTitle>
            </div>
            <CardDescription>
              Add medical documents
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Family</CardTitle>
            </div>
            <CardDescription>
              Manage family health records
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Health Records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">0</div>
            <p className="text-sm text-gray-600">Total records stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>AI Interactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-sm text-gray-600">Questions asked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Family Members</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">1</div>
            <p className="text-sm text-gray-600">Including you</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Take these steps to make the most of your health record manager
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Add your first health record</h3>
              <p className="text-sm text-gray-600">Start by adding a recent medical visit or test result</p>
            </div>
            <Link href="/dashboard/records/new">
              <Button>Add Record</Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Try the AI assistant</h3>
              <p className="text-sm text-gray-600">Ask questions about your health and get intelligent insights</p>
            </div>
            <Link href="/dashboard/ai">
              <Button variant="outline">Try AI</Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Invite family members</h3>
              <p className="text-sm text-gray-600">Share and manage health records with your family</p>
            </div>
            <Link href="/dashboard/family">
              <Button variant="outline">Manage Family</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
