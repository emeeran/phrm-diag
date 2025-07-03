"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState, CardLoading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { TrendingUp, AlertTriangle, Heart, Activity, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FamilyInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  date: string;
  relatedUserId?: string;
  relatedUserName?: string;
}

export default function FamilyHealthInsights() {
  const [insights, setInsights] = useState<FamilyInsight[]>([
    // Mock insights - in a real app these would come from the API
    {
      id: "1",
      type: "pattern",
      title: "Recurring headaches detected",
      description: "Multiple family members reported headaches in the past 2 weeks. Consider environmental factors.",
      severity: "medium",
      date: new Date().toISOString()
    },
    {
      id: "2",
      type: "reminder",
      title: "Annual checkups coming up",
      description: "3 family members are due for annual checkups in the next 30 days.",
      severity: "low",
      date: new Date().toISOString()
    },
    {
      id: "3",
      type: "alert",
      title: "Possible medication interaction",
      description: "Two family members are taking medications that may interact. Please consult with a healthcare provider.",
      severity: "high",
      date: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // In a real application, we would fetch insights from the API
  // useEffect(() => {
  //   const fetchInsights = async () => {
  //     setLoading(true);
  //     setError("");
  //     
  //     try {
  //       const response = await fetch("/api/family/insights");
  //       const data = await response.json();
  //       
  //       if (!response.ok) {
  //         throw new Error(data.error || "Failed to fetch family health insights");
  //       }
  //       
  //       setInsights(data);
  //     } catch (err: any) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchInsights();
  // }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'reminder':
        return <Calendar className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-purple-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Priority</Badge>;
      default:
        return <Badge className="bg-green-500">Low Priority</Badge>;
    }
  };

  if (loading) {
    return <CardLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Heart className="mr-2 h-5 w-5 text-red-500" />
              Family Health Insights
            </CardTitle>
            <CardDescription>
              AI-generated insights based on your family's health records
            </CardDescription>
          </div>
          {/* In a real app, add a refresh button here */}
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No insights available yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add more health records to generate insights about your family's health patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className={`p-4 rounded-lg border ${
                  insight.severity === 'high' ? 'bg-red-50 border-red-100' : 
                  insight.severity === 'medium' ? 'bg-yellow-50 border-yellow-100' : 
                  'bg-green-50 border-green-100'
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      {getSeverityBadge(insight.severity)}
                    </div>
                    <p className="mt-1 text-gray-600">{insight.description}</p>
                    {insight.relatedUserName && (
                      <p className="mt-1 text-sm text-gray-500">
                        Related to: {insight.relatedUserName}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Generated: {new Date(insight.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Medical disclaimer */}
        <Alert className="mt-6 bg-blue-50 border-blue-100">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-700">
            These insights are generated based on recorded health data and may not be medically accurate. 
            Always consult with healthcare professionals for medical advice.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
