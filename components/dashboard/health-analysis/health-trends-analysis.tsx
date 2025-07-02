"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-boundary';
import { ArrowUp, ArrowRight, TrendingUp, Calendar, Activity } from 'lucide-react';

interface HealthTrend {
  type: 'symptom_pattern' | 'medication' | 'appointment' | 'lab_result' | 'general';
  description: string;
  relevantDates?: string[];
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

interface HealthTrendsResponse {
  trends: HealthTrend[];
  summary: string;
  error?: string;
}

export function HealthTrendsAnalysis() {
  const [trends, setTrends] = useState<HealthTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealthTrends() {
      try {
        setLoading(true);
        const response = await fetch('/api/ai/analysis/trends');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch health trends');
        }
        
        const data = await response.json();
        setTrends(data);
      } catch (err: any) {
        console.error('Error fetching health trends:', err);
        setError(err.message || 'Failed to analyze health trends');
      } finally {
        setLoading(false);
      }
    }

    fetchHealthTrends();
  }, []);

  if (loading) {
    return <LoadingState message="Analyzing your health trends..." variant="icon" iconType="rotate" />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!trends || !trends.trends || trends.trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trend Analysis</CardTitle>
          <CardDescription>AI-powered analysis of your health records</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {trends?.summary || "No significant health trends detected. This could be because you have too few health records or they don't show any clear patterns."}
          </p>
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          Add more health records for a more comprehensive analysis.
        </CardFooter>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'symptom_pattern': return <Activity className="h-5 w-5 text-purple-600" />;
      case 'medication': return <ArrowRight className="h-5 w-5 text-blue-600" />;
      case 'appointment': return <Calendar className="h-5 w-5 text-green-600" />;
      case 'lab_result': return <ArrowUp className="h-5 w-5 text-orange-600" />;
      default: return <TrendingUp className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Health Trend Analysis</CardTitle>
          <CardDescription>AI-powered analysis of your health records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700">{trends.summary}</p>
          </div>
          
          <h3 className="text-lg font-medium mb-2">Detected Trends</h3>
          <div className="space-y-4">
            {trends.trends.map((trend, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start gap-3 mb-2">
                  {getTypeIcon(trend.type)}
                  <div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      <Badge className="capitalize">{trend.type.replace('_', ' ')}</Badge>
                      <Badge className={getSeverityColor(trend.severity)}>
                        {trend.severity} severity
                      </Badge>
                    </div>
                    <p className="font-medium">{trend.description}</p>
                  </div>
                </div>
                
                {trend.relevantDates && trend.relevantDates.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Relevant dates: </span>
                    {trend.relevantDates.join(', ')}
                  </div>
                )}
                
                {trend.recommendation && (
                  <div className="mt-2 text-sm bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="font-medium">Suggestion: </span>
                    {trend.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          <p>This analysis is based on your health records and is for informational purposes only. Always consult healthcare professionals for medical advice.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
