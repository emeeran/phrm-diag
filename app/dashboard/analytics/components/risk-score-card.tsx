'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, Download } from 'lucide-react';
import { RiskScore } from '@/lib/analytics';
import { riskScoreToRadarChart, riskScoreToPieChart } from '@/lib/visualization';
import dynamic from 'next/dynamic';

// Dynamic imports for the chart components
const RadarChartComponent = dynamic(() => import('@/components/charts/RadarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-60 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

const PieChartComponent = dynamic(() => import('@/components/charts/PieChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-60 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

interface RiskScoreCardProps {
  analysis: {
    id: string;
    summary: string;
    trends: RiskScore;
    createdAt: string;
    recordsAnalyzed: number;
  };
}

export default function RiskScoreCard({ analysis }: RiskScoreCardProps) {
  const riskScore = analysis.trends as unknown as RiskScore;
  
  // Prepare chart data
  const radarData = riskScoreToRadarChart(riskScore);
  const pieData = riskScoreToPieChart(riskScore);
  
  // Get color based on risk level
  const getRiskLevelColor = () => {
    switch (riskScore.level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'severe':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" /> 
                Health Risk Assessment
              </CardTitle>
              <CardDescription>
                Based on {analysis.recordsAnalyzed} health records • 
                Generated {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-md">
              <p>{analysis.summary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-lg">Overall Risk Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40">
                    <PieChartComponent data={pieData} />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-4xl font-bold">{riskScore.score}</div>
                      <div className={`text-sm rounded-full px-2 py-0.5 uppercase ${getRiskLevelColor()}`}>
                        {riskScore.level}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-lg">Risk Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <RadarChartComponent data={radarData} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" /> 
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {riskScore.factors.map((factor, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2">
                          {index + 1}
                        </div>
                        <span>{factor}</span>
                      </li>
                    ))}
                    {riskScore.factors.length === 0 && (
                      <li className="text-muted-foreground">No significant risk factors detected</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {riskScore.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                          {index + 1}
                        </div>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                    {riskScore.recommendations.length === 0 && (
                      <li className="text-muted-foreground">Continue with regular health check-ups</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t">
          <p className="text-sm text-muted-foreground">This risk assessment is for informational purposes only and should not replace professional medical advice.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
