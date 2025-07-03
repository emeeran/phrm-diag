'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsLoading } from '@/components/ui/loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarIcon, Activity, Pill, BarChart2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import TrendAnalysis from './components/trend-analysis';
import RiskScoreCard from './components/risk-score-card';
import MedicationAnalysis from './components/medication-analysis';
import SymptomAnalysis from './components/symptom-analysis';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('trends');
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  // Fetch list of analyses on mount
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch analyses');
        }
        
        const data = await response.json();
        setAnalyses(data);
        
        // Set current analysis to the most recent one of the active type
        const analysisOfActiveType = data.find((a: any) => a.analysisType === activeTab);
        if (analysisOfActiveType) {
          fetchAnalysisDetails(analysisOfActiveType.id);
        }
      } catch (err) {
        console.error('Error fetching analyses:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyses();
  }, [activeTab]);
  
  // Fetch details for a specific analysis
  const fetchAnalysisDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis details');
      }
      
      const data = await response.json();
      setCurrentAnalysis(data);
    } catch (err) {
      console.error('Error fetching analysis details:', err);
      setError('Failed to load analysis details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate a new analysis
  const generateAnalysis = async (type: string) => {
    try {
      setGeneratingAnalysis(true);
      setError(null);
      
      const response = await fetch('/api/analytics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisType: type }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate analysis');
      }
      
      const { analysisId } = await response.json();
      
      // Fetch the new analysis
      await fetchAnalysisDetails(analysisId);
      
      // Refresh the list of analyses
      const analysesResponse = await fetch('/api/analytics');
      const analysesData = await analysesResponse.json();
      setAnalyses(analysesData);
      
    } catch (err: any) {
      console.error('Error generating analysis:', err);
      setError(err.message || 'Failed to generate health analytics. Please try again later.');
    } finally {
      setGeneratingAnalysis(false);
    }
  };
  
  // Get icon for analysis type
  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'trends':
        return <Activity className="h-4 w-4" />;
      case 'medication':
        return <Pill className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
      case 'symptoms':
        return <BarChart2 className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };
  
  // Format analysis type for display
  const formatAnalysisType = (type: string) => {
    switch (type) {
      case 'trends':
        return 'Health Trends';
      case 'medication':
        return 'Medication Effectiveness';
      case 'risk':
        return 'Health Risk Assessment';
      case 'symptoms':
        return 'Symptom Patterns';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Health Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Gain valuable insights about your health trends, risks, and patterns
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs 
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setCurrentAnalysis(null);
        }}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="trends">
              <Activity className="mr-2 h-4 w-4" />
              Health Trends
            </TabsTrigger>
            <TabsTrigger value="medication">
              <Pill className="mr-2 h-4 w-4" />
              Medication
            </TabsTrigger>
            <TabsTrigger value="risk">
              <AlertCircle className="mr-2 h-4 w-4" />
              Risk Score
            </TabsTrigger>
            <TabsTrigger value="symptoms">
              <BarChart2 className="mr-2 h-4 w-4" />
              Symptoms
            </TabsTrigger>
          </TabsList>
          
          <Button 
            onClick={() => generateAnalysis(activeTab)}
            disabled={generatingAnalysis}
          >
            {generatingAnalysis ? 'Generating...' : 'Generate New Analysis'}
          </Button>
        </div>
        
        {/* Recent analyses section */}
        {analyses.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Analyses</h3>
            <div className="flex flex-wrap gap-2">
              {analyses
                .filter(a => a.analysisType === activeTab)
                .slice(0, 5)
                .map(analysis => (
                  <Badge 
                    key={analysis.id} 
                    variant={currentAnalysis?.id === analysis.id ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => fetchAnalysisDetails(analysis.id)}
                  >
                    <CalendarIcon className="h-3 w-3" /> 
                    {format(new Date(analysis.createdAt), 'MMM d')}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-8 flex justify-center">
            <AnalyticsLoading />
          </div>
        ) : (
          <>
            <TabsContent value="trends" className="mt-6">
              {currentAnalysis ? (
                <TrendAnalysis analysis={currentAnalysis} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Health Trend Analysis</CardTitle>
                    <CardDescription>
                      No trend analysis has been generated yet. Click &quot;Generate New Analysis&quot; to create one.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="medication" className="mt-6">
              {currentAnalysis ? (
                <MedicationAnalysis analysis={currentAnalysis} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Medication Effectiveness Analysis</CardTitle>
                    <CardDescription>
                      No medication analysis has been generated yet. Click &quot;Generate New Analysis&quot; to create one.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="risk" className="mt-6">
              {currentAnalysis ? (
                <RiskScoreCard analysis={currentAnalysis} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Health Risk Assessment</CardTitle>
                    <CardDescription>
                      No risk assessment has been generated yet. Click &quot;Generate New Analysis&quot; to create one.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="symptoms" className="mt-6">
              {currentAnalysis ? (
                <SymptomAnalysis analysis={currentAnalysis} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Symptom Pattern Analysis</CardTitle>
                    <CardDescription>
                      No symptom analysis has been generated yet. Click &quot;Generate New Analysis&quot; to create one.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
