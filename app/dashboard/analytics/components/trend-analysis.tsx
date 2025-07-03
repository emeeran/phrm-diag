'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Activity, LineChart, BarChart, Download } from 'lucide-react';
import { TrendPoint } from '@/lib/analytics';
import { trendsToLineChart, trendsToBarChart, generateTrendStatistics } from '@/lib/visualization';
import dynamic from 'next/dynamic';

// Dynamic imports for the chart components
const LineChartComponent = dynamic(() => import('@/components/charts/LineChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

const BarChartComponent = dynamic(() => import('@/components/charts/BarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

interface TrendAnalysisProps {
  analysis: {
    id: string;
    summary: string;
    trends: TrendPoint[];
    createdAt: string;
    recordsAnalyzed: number;
  };
}

export default function TrendAnalysis({ analysis }: TrendAnalysisProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Prepare chart data
  const lineChartData = trendsToLineChart(analysis.trends);
  const barChartData = trendsToBarChart(analysis.trends);
  
  // Generate statistics
  const statistics = generateTrendStatistics(analysis.trends);
  
  // Generate report filename
  const reportFilename = `health-trends-${new Date().toISOString().split('T')[0]}.pdf`;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" /> 
                Health Trend Analysis
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
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <p>{analysis.summary}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Trend Visualization</h3>
              <div className="flex space-x-2">
                <Button 
                  variant={chartType === 'line' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  <LineChart className="h-4 w-4 mr-1" /> Line
                </Button>
                <Button 
                  variant={chartType === 'bar' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart className="h-4 w-4 mr-1" /> Bar
                </Button>
              </div>
            </div>
            
            <div className="h-80">
              {chartType === 'line' ? (
                <LineChartComponent data={lineChartData} />
              ) : (
                <BarChartComponent data={barChartData} />
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Statistics by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(statistics).map(([category, stats]: [string, any]) => (
                  <Card key={category}>
                    <CardHeader className="py-4">
                      <CardTitle className="text-md">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Min</dt>
                          <dd className="font-medium">{stats.min}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Max</dt>
                          <dd className="font-medium">{stats.max}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Average</dt>
                          <dd className="font-medium">{stats.average}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Median</dt>
                          <dd className="font-medium">{stats.median}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Records</dt>
                          <dd className="font-medium">{stats.count}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
