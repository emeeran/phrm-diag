'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { Award, Calendar, TrendingUp, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HealthMilestoneAlertsProps {
  alerts: any[];
  generateAlert: () => Promise<boolean>;
  dismissAlert: (id: string) => Promise<boolean>;
  isGenerating: boolean;
  showDismissed: boolean;
}

export default function HealthMilestoneAlerts({
  alerts,
  generateAlert,
  dismissAlert,
  isGenerating,
  showDismissed
}: HealthMilestoneAlertsProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateAlert = async () => {
    setLoading(true);
    await generateAlert();
    setLoading(false);
  };

  const handleDismissAlert = async (id: string) => {
    setLoading(true);
    await dismissAlert(id);
    setLoading(false);
  };

  // Get milestone icon based on type
  const getMilestoneIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'weight':
        return '⚖️';
      case 'exercise':
        return '🏃‍♀️';
      case 'blood pressure':
        return '❤️';
      case 'cholesterol':
        return '🩸';
      case 'nutrition':
        return '🥗';
      case 'sleep':
        return '😴';
      case 'mental health':
        return '🧠';
      default:
        return '🏆';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Health Milestones"
          description={
            showDismissed 
              ? "You don't have any health milestone alerts, including dismissed ones."
              : "You haven't reached any new health milestones yet. Keep going!"
          }
          icon={<Award className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateAlert} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Checking...' : 'Check for Milestones'}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Milestones</h2>
          <p className="text-muted-foreground">
            Celebrate your health achievements
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGenerateAlert}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Checking...' : 'Check for Milestones'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          // Parse JSON data if needed
          const alertData = typeof alert.data === 'string' ? JSON.parse(alert.data) : alert.data;
          const progress = alertData?.progress || 100;
          const milestoneType = alertData?.milestoneType || '';
          
          return (
            <Card 
              key={alert.id} 
              className={`
                ${alert.dismissed ? 'opacity-60' : ''} 
                border-blue-200 ${!alert.dismissed ? 'bg-blue-50' : ''}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{getMilestoneIcon(milestoneType)}</span>
                    {alert.title}
                  </CardTitle>
                  {alert.dismissed && (
                    <Badge variant="outline">Dismissed</Badge>
                  )}
                </div>
                <CardDescription className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> 
                  Achieved on: {format(
                    alertData?.achievementDate
                      ? parseISO(alertData.achievementDate)
                      : new Date(alert.createdAt),
                    'MMM d, yyyy'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{alert.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                {alertData?.nextStep && (
                  <div className="mt-3 p-3 bg-blue-100 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Next step:</p>
                    <p className="text-sm text-blue-700">{alertData.nextStep}</p>
                  </div>
                )}
              </CardContent>
              {!alert.dismissed && (
                <CardFooter className="pt-0">
                  <div className="flex gap-2 ml-auto">
                    <Button variant="secondary" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDismissAlert(alert.id)}
                      disabled={loading}
                    >
                      {loading ? 'Dismissing...' : 'Dismiss'}
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex gap-3">
          <Award className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">Why Milestones Matter</h3>
            <p className="text-sm text-green-700">
              Celebrating health milestones helps maintain motivation and track progress toward your overall health goals.
              Each milestone represents a meaningful achievement in your health journey. Share your achievements with
              family members for added encouragement and support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
