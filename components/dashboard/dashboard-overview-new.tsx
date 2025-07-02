"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, FileText, MessageSquare, Plus, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorDisplay, handleApiError } from "@/components/ui/error-boundary";

interface DashboardOverviewProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

interface DashboardStats {
  totalRecords: number;
  recentRecords: any[];
  aiInteractions: number;
  recordsByCategory: { [key: string]: number };
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/health-record");
      
      if (!res.ok) {
        const errorData = await res.json();
        throw { status: res.status, message: errorData.error || 'Failed to fetch dashboard data' };
      }
      
      const records = await res.json();
      
      // Calculate stats
      const recordsByCategory = records.reduce((acc: any, record: any) => {
        acc[record.category] = (acc[record.category] || 0) + 1;
        return acc;
      }, {});

      const recentRecords = records
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      setStats({
        totalRecords: records.length,
        recentRecords,
        aiInteractions: 0, // TODO: Implement AI interaction tracking
        recordsByCategory,
      });
    } catch (error: any) {
      console.error("Failed to fetch dashboard stats:", error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

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

      {/* Error Display */}
      <ErrorDisplay error={error} onRetry={fetchDashboardStats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/records/new">
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
        </Link>

        <Link href="/dashboard/ai">
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
        </Link>

        <Link href="/dashboard/records">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">View Records</CardTitle>
              </div>
              <CardDescription>
                Browse your health records
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/family">
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
        </Link>
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
            <div className="text-3xl font-bold text-blue-600">
              {loading ? <LoadingSpinner size="sm" /> : (stats?.totalRecords || 0)}
            </div>
            <p className="text-sm text-gray-600">Total records stored</p>
            <Link href="/dashboard/records" className="mt-2 inline-block">
              <Button variant="outline" size="sm">View All Records</Button>
            </Link>
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
            <div className="text-3xl font-bold text-green-600">
              {loading ? <LoadingSpinner size="sm" /> : (stats?.aiInteractions || 0)}
            </div>
            <p className="text-sm text-gray-600">Questions asked</p>
            <Link href="/dashboard/ai" className="mt-2 inline-block">
              <Button variant="outline" size="sm">Try AI Assistant</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Health Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? <LoadingSpinner size="sm" /> : (stats?.recordsByCategory ? Object.keys(stats.recordsByCategory).length : 0)}
            </div>
            <p className="text-sm text-gray-600">Categories tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      {stats && stats.recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Records</CardTitle>
            <CardDescription>
              Your latest health entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{record.title}</h4>
                    <p className="text-sm text-gray-600">
                      {record.category.replace('_', ' ')} • {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/dashboard/records/${record.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/dashboard/records">
                <Button variant="outline" className="w-full">View All Records</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {(!stats || stats.totalRecords === 0) && (
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
      )}
    </div>
  )
}
