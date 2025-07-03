'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

interface PersonalizedRecommendationsProps {
  currentInsight: any;
  generateInsight: () => Promise<boolean>;
  isGenerating: boolean;
}

export default function PersonalizedRecommendations({ 
  currentInsight, 
  generateInsight,
  isGenerating 
}: PersonalizedRecommendationsProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateInsight = async () => {
    setLoading(true);
    await generateInsight();
    setLoading(false);
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'diet':
        return '🍎';
      case 'exercise':
        return '🏃‍♀️';
      case 'lifestyle':
        return '⚖️';
      case 'medical':
        return '💊';
      case 'mental health':
        return '🧠';
      case 'sleep':
        return '😴';
      default:
        return '✅';
    }
  };

  if (!currentInsight) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Health Recommendations"
          description="You don't have any personalized health recommendations yet. Generate recommendations to receive tailored health advice based on your data."
          icon={<Heart className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateInsight} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Generating...' : 'Generate Health Recommendations'}
            </Button>
          }
        />
      </div>
    );
  }

  // Parse the JSON data
  const recommendationsData = typeof currentInsight.data === 'string' 
    ? JSON.parse(currentInsight.data) 
    : currentInsight.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Health Recommendations</h2>
          <p className="text-muted-foreground">
            Generated on {format(new Date(currentInsight.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGenerateInsight}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Updating...' : 'Update Recommendations'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recommendationsData.map((recommendation: any, index: number) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getCategoryIcon(recommendation.category)}</span>
                  <CardTitle>{recommendation.title}</CardTitle>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{recommendation.category}</span>
                  {getImportanceBadge(recommendation.importance)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p>{recommendation.description}</p>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Suggested Actions:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {recommendation.actions.map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 text-sm">
              <div className="w-full">
                <p className="font-medium">Evidence:</p>
                <p className="text-gray-600">{recommendation.evidence}</p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" className="flex items-center">
          Export Recommendations <ArrowUpRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
