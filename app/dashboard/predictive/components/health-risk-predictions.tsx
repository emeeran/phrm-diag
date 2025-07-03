'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface HealthRiskPredictionsProps {
  currentInsight: any;
  generateInsight: () => Promise<boolean>;
  isGenerating: boolean;
}

export default function HealthRiskPredictions({ 
  currentInsight, 
  generateInsight,
  isGenerating 
}: HealthRiskPredictionsProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateInsight = async () => {
    setLoading(true);
    await generateInsight();
    setLoading(false);
  };

  const getRiskBadge = (probability: number) => {
    if (probability >= 70) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertTriangle className="h-3 w-3 mr-1" /> High Risk
        </Badge>
      );
    } else if (probability >= 40) {
      return (
        <Badge variant="warning" className="ml-2 bg-yellow-500">
          <AlertTriangle className="h-3 w-3 mr-1" /> Medium Risk
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="ml-2 bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" /> Low Risk
        </Badge>
      );
    }
  };

  if (!currentInsight) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Health Risk Predictions"
          description="You don't have any health risk predictions yet. Generate your first prediction to see potential health risks based on your health data."
          icon={<ShieldAlert className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateInsight} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Generating...' : 'Generate Health Risk Prediction'}
            </Button>
          }
        />
      </div>
    );
  }

  // Parse the JSON data
  const predictionsData = typeof currentInsight.data === 'string' 
    ? JSON.parse(currentInsight.data) 
    : currentInsight.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Risk Predictions</h2>
          <p className="text-muted-foreground">
            Generated on {format(new Date(currentInsight.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGenerateInsight}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Updating...' : 'Update Predictions'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predictionsData.map((prediction: any, index: number) => (
          <Card key={index} className={prediction.probability >= 70 ? 'border-red-300' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{prediction.condition}</CardTitle>
                {getRiskBadge(prediction.probability)}
              </div>
              <CardDescription>Estimated timeframe: {prediction.timeframe}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Risk Probability:</span>
                  <span className="font-bold">{prediction.probability}%</span>
                </div>
                <Progress value={prediction.probability} className="h-2" />
                
                <div className="mt-4">
                  <h4 className="font-semibold mb-1">Key Factors:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {prediction.factors.map((factor: string, i: number) => (
                      <li key={i} className="text-sm">{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div>
                <h4 className="font-semibold mb-1">Prevention Steps:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {prediction.preventionSteps.map((step: string, i: number) => (
                    <li key={i} className="text-sm">{step}</li>
                  ))}
                </ul>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">About Health Risk Predictions</h3>
            <p className="text-sm text-blue-700">
              These predictions are based on your health records and general health patterns.
              They are meant to be informative, not diagnostic. Always consult with healthcare
              professionals for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
