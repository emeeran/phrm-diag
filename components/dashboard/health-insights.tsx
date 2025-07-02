"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HealthTrend {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface HealthInsights {
  trends: HealthTrend[];
  summary: string;
  error?: string;
}

export function HealthInsights() {
  const [insights, setInsights] = useState<HealthInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch("/api/ai/analysis/trends");
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch health insights');
        }
        
        const data = await res.json();
        setInsights(data);
      } catch (err: any) {
        console.error("Error fetching health insights:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    
    fetchInsights();
  }, []);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Health Insights
        </CardTitle>
        <CardDescription>AI-powered analysis of your health records</CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="flex justify-center py-6">
            <LoadingSpinner size="md" />
          </div>
        )}
        
        {error && (
          <div className="flex items-center p-4 bg-red-50 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="font-medium text-red-800">Error loading insights</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
        
        {!loading && !error && insights && (
          <div className="space-y-4">
            {insights.summary && (
              <p className="text-sm text-gray-700">{insights.summary}</p>
            )}
            
            {insights.trends && insights.trends.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Top Insights:</h4>
                <ul className="space-y-2">
                  {insights.trends.slice(0, 3).map((trend, idx) => (
                    <li key={idx} className="flex items-center p-2 bg-gray-50 rounded-md">
                      <Badge className={`mr-2 ${getSeverityColor(trend.severity)}`}>
                        {trend.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm">{trend.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No significant health trends detected. This could be due to limited health records.
              </p>
            )}
          </div>
        )}
        
        {!loading && !error && !insights && (
          <div className="text-center p-4">
            <p className="text-gray-500">No health insights available yet.</p>
            <p className="text-sm text-gray-400 mt-1">Add more health records for AI analysis.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Link href="/dashboard/health-analysis" passHref>
          <Button variant="outline" size="sm" className="w-full">
            View Full Analysis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
