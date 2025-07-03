'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsLoading } from '@/components/ui/loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Calendar, 
  ShieldAlert, 
  Heart, 
  RefreshCw, 
  Clock,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

import HealthRiskPredictions from './components/health-risk-predictions';
import PersonalizedRecommendations from './components/personalized-recommendations';
import AppointmentTiming from './components/appointment-timing';
import PreventiveCareReminders from './components/preventive-care-reminders';

export default function PredictiveDashboard() {
  const [activeTab, setActiveTab] = useState('risk');
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInsight, setCurrentInsight] = useState<any>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Fetch list of insights on mount
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/predictive');
        
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        
        const data = await response.json();
        setInsights(data.insights || []);
        
        // Set current insight to the most recent one of the active type
        const insightOfActiveType = data.insights?.find((i: any) => i.insightType === activeTab);
        if (insightOfActiveType) {
          fetchInsightDetails(insightOfActiveType.id);
        } else {
          setCurrentInsight(null);
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load predictive insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [activeTab]);

  // Fetch details of a specific insight
  const fetchInsightDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/predictive/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch insight details');
      }
      
      const data = await response.json();
      setCurrentInsight(data.insight);
    } catch (err) {
      console.error('Error fetching insight details:', err);
      setError('Failed to load insight details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Generate a new insight
  const generateInsight = async (type: string) => {
    try {
      setGeneratingInsight(true);
      setError(null);
      
      const response = await fetch('/api/predictive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }
      
      // Refresh insights list
      const insightsResponse = await fetch('/api/predictive');
      const insightsData = await insightsResponse.json();
      
      setInsights(insightsData.insights || []);
      
      // Set current insight to the most recent one of the active type
      const insightOfActiveType = insightsData.insights?.find((i: any) => i.insightType === type);
      if (insightOfActiveType) {
        fetchInsightDetails(insightOfActiveType.id);
      }
      
      return true;
    } catch (err) {
      console.error('Error generating insight:', err);
      setError('Failed to generate predictive insight. Please try again later.');
      return false;
    } finally {
      setGeneratingInsight(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Find the most recent insight of the new active type
    const insightOfActiveType = insights.find((i: any) => i.insightType === value);
    if (insightOfActiveType) {
      fetchInsightDetails(insightOfActiveType.id);
    } else {
      setCurrentInsight(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Predictive Health Insights</h1>
          <p className="text-muted-foreground">
            AI-powered health predictions and personalized recommendations
          </p>
        </div>
        <Button
          onClick={() => generateInsight(activeTab)}
          disabled={generatingInsight}
        >
          {generatingInsight ? (
            <>Generating <RefreshCw className="ml-2 h-4 w-4 animate-spin" /></>
          ) : (
            <>Refresh Insights <Sparkles className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="risk" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:max-w-2xl">
          <TabsTrigger value="risk">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Health Risks
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Heart className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="preventive">
            <Clock className="h-4 w-4 mr-2" />
            Preventive Care
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {loading ? (
            <AnalyticsLoading message="Loading predictive insights..." />
          ) : (
            <>
              <TabsContent value="risk" className="space-y-4">
                <HealthRiskPredictions 
                  currentInsight={currentInsight} 
                  generateInsight={() => generateInsight('risk')}
                  isGenerating={generatingInsight}
                />
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <PersonalizedRecommendations 
                  currentInsight={currentInsight} 
                  generateInsight={() => generateInsight('recommendations')}
                  isGenerating={generatingInsight}
                />
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                <AppointmentTiming 
                  currentInsight={currentInsight} 
                  generateInsight={() => generateInsight('appointments')}
                  isGenerating={generatingInsight}
                />
              </TabsContent>

              <TabsContent value="preventive" className="space-y-4">
                <PreventiveCareReminders 
                  currentInsight={currentInsight} 
                  generateInsight={() => generateInsight('preventive')}
                  isGenerating={generatingInsight}
                />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
