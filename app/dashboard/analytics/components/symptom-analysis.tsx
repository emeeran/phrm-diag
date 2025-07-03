'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { BarChart2, Download, XCircle } from 'lucide-react';
import { SymptomPattern } from '@/lib/analytics';
import { symptomsToFrequencyChart, symptomsToIntensityChart, symptomsToHeatMap } from '@/lib/visualization';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import dynamic from 'next/dynamic';

// Dynamic imports for the chart components
const BarChartComponent = dynamic(() => import('@/components/charts/BarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-60 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

const HeatMapComponent = dynamic(() => import('@/components/charts/HeatMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

interface SymptomAnalysisProps {
  analysis: {
    id: string;
    summary: string;
    trends: SymptomPattern[];
    createdAt: string;
    recordsAnalyzed: number;
  };
}

export default function SymptomAnalysis({ analysis }: SymptomAnalysisProps) {
  const symptoms = analysis.trends as unknown as SymptomPattern[];
  
  // Prepare chart data
  const frequencyChart = symptomsToFrequencyChart(symptoms);
  const intensityChart = symptomsToIntensityChart(symptoms);
  const heatMapData = symptoms.length > 2 ? symptomsToHeatMap(symptoms) : null;
  
  // Get intensity color
  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'text-red-600';
    if (intensity >= 6) return 'text-orange-500';
    if (intensity >= 4) return 'text-amber-500';
    return 'text-yellow-500';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" /> 
                Symptom Pattern Analysis
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
            
            {symptoms.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">Symptom Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <BarChartComponent data={frequencyChart} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">Symptom Intensity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <BarChartComponent data={intensityChart} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {heatMapData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">Symptom Correlations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <HeatMapComponent data={heatMapData} />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 border-t">
                      <p className="text-sm text-muted-foreground">This heatmap shows the correlation strength between symptoms and other health factors.</p>
                    </CardFooter>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Symptom Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symptom</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Intensity</TableHead>
                          <TableHead>Common Triggers</TableHead>
                          <TableHead>Top Correlation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {symptoms.map((symptom, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{symptom.symptom}</TableCell>
                            <TableCell>{symptom.frequency}</TableCell>
                            <TableCell className={getIntensityColor(symptom.intensity)}>
                              {Math.round(symptom.intensity * 10) / 10}/10
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {symptom.triggers.length > 0 ? (
                                  symptom.triggers.slice(0, 2).map((trigger, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-blue-50">
                                      {trigger}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-400">None identified</span>
                                )}
                                {symptom.triggers.length > 2 && (
                                  <Badge variant="outline">+{symptom.triggers.length - 2} more</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {symptom.correlations.length > 0 ? (
                                <div className="flex items-center">
                                  <span className="mr-1">{symptom.correlations[0].factor.split(':')[1]}</span>
                                  <Badge variant="outline" className="bg-purple-50">
                                    {Math.round(symptom.correlations[0].strength * 100)}%
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-gray-400">None found</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Symptom Data</h3>
                  <p className="text-muted-foreground">
                    There is no symptom data available for analysis. Add symptom records to generate insights.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t">
          <p className="text-sm text-muted-foreground">This symptom analysis is for informational purposes only and should not replace professional medical advice.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
