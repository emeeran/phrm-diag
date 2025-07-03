'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Pill, Download, CheckCircle, XCircle } from 'lucide-react';
import { MedicationEffectiveness } from '@/lib/analytics';
import { medicationToPieChart, medicationToAdherenceChart, formatMedicationSideEffects } from '@/lib/visualization';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

// Dynamic imports for the chart components
const PieChartComponent = dynamic(() => import('@/components/charts/PieChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-60 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

const BarChartComponent = dynamic(() => import('@/components/charts/BarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-60 bg-gray-50 animate-pulse rounded-md flex items-center justify-center">Loading chart...</div>
});

interface MedicationAnalysisProps {
  analysis: {
    id: string;
    summary: string;
    trends: MedicationEffectiveness[];
    createdAt: string;
    recordsAnalyzed: number;
  };
}

export default function MedicationAnalysis({ analysis }: MedicationAnalysisProps) {
  const medications = analysis.trends as unknown as MedicationEffectiveness[];
  
  // Prepare chart data
  const pieData = medicationToPieChart(medications);
  const adherenceData = medicationToAdherenceChart(medications);
  const sideEffects = formatMedicationSideEffects(medications);
  
  // Get effectiveness color
  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 80) return 'text-green-600';
    if (effectiveness >= 60) return 'text-emerald-500';
    if (effectiveness >= 40) return 'text-yellow-500';
    if (effectiveness >= 20) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Get adherence color
  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return 'text-green-600';
    if (adherence >= 60) return 'text-emerald-500';
    if (adherence >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Pill className="mr-2 h-5 w-5" /> 
                Medication Effectiveness Analysis
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
            
            {medications.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">Effectiveness Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <PieChartComponent data={pieData} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">Medication Adherence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <BarChartComponent data={adherenceData} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medication Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {medications.map((medication, index) => (
                        <Card key={index}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-md">{medication.medicationName}</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Effectiveness & Adherence</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Effectiveness</span>
                                    <span className={`font-medium ${getEffectivenessColor(medication.effectiveness)}`}>
                                      {medication.effectiveness}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Adherence</span>
                                    <span className={`font-medium ${getAdherenceColor(medication.adherence)}`}>
                                      {medication.adherence}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">Side Effects</h4>
                                {medication.sideEffects.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {medication.sideEffects.map((effect, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-red-50">
                                        {effect}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                    No side effects detected
                                  </div>
                                )}
                              </div>
                            </div>
                            {medication.interactions.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2">Potential Interactions</h4>
                                <div className="flex flex-wrap gap-1">
                                  {medication.interactions.map((interaction, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-amber-50">
                                      {interaction}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Medication Data</h3>
                  <p className="text-muted-foreground">
                    There is no medication data available for analysis. Add medication records to generate insights.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t">
          <p className="text-sm text-muted-foreground">This medication analysis is for informational purposes only. Never change medication without consulting your healthcare provider.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
