'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { Target, Calendar, CheckCircle, InfoIcon } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

interface WellnessGoalAlertsProps {
  alerts: any[];
  generateAlert: () => Promise<boolean>;
  dismissAlert: (id: string) => Promise<boolean>;
  isGenerating: boolean;
  showDismissed: boolean;
}

export default function WellnessGoalAlerts({
  alerts,
  generateAlert,
  dismissAlert,
  isGenerating,
  showDismissed
}: WellnessGoalAlertsProps) {
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

  // Get goal icon based on type
  const getGoalIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'steps':
        return '👣';
      case 'exercise':
        return '🏋️';
      case 'nutrition':
        return '🍎';
      case 'hydration':
        return '💧';
      case 'sleep':
        return '💤';
      case 'mindfulness':
        return '🧘';
      case 'weight':
        return '⚖️';
      default:
        return '🎯';
    }
  };

  // Check if target date is in the past
  const isOverdue = (targetDate: string) => {
    try {
      const date = parseISO(targetDate);
      return isAfter(new Date(), date);
    } catch (e) {
      return false;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Wellness Goals"
          description={
            showDismissed 
              ? "You don't have any wellness goal alerts, including dismissed ones."
              : "You don't have any active wellness goals. Generate new goals to get started."
          }
          icon={<Target className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateAlert} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Generating...' : 'Generate Wellness Goals'}
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
          <h2 className="text-2xl font-bold">Wellness Goals</h2>
          <p className="text-muted-foreground">
            Personalized goals to improve your wellness
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGenerateAlert}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Generating...' : 'Update Goals'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          // Parse JSON data if needed
          const alertData = typeof alert.data === 'string' ? JSON.parse(alert.data) : alert.data;
          const progress = alertData?.progress || 0;
          const goalType = alertData?.goalType || '';
          const targetDate = alertData?.targetDate;
          const overdue = targetDate ? isOverdue(targetDate) : false;
          
          return (
            <Card 
              key={alert.id} 
              className={`
                ${alert.dismissed ? 'opacity-60' : ''} 
                ${overdue ? 'border-amber-300' : 'border-green-200'}
                ${!alert.dismissed && (overdue ? 'bg-amber-50' : 'bg-green-50')}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{getGoalIcon(goalType)}</span>
                    {alert.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge variant="default">Overdue</Badge>}
                    {alert.dismissed && <Badge variant="outline">Dismissed</Badge>}
                  </div>
                </div>
                {targetDate && (
                  <CardDescription className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> 
                    Target date: {format(parseISO(targetDate), 'MMM d, yyyy')}
                  </CardDescription>
                )}
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
                
                {alertData?.recommendation && (
                  <div className="mt-3 p-3 bg-green-100 rounded-md">
                    <p className="text-sm font-medium text-green-800">Recommendation:</p>
                    <p className="text-sm text-green-700">{alertData.recommendation}</p>
                  </div>
                )}
              </CardContent>
              {!alert.dismissed && (
                <CardFooter className="pt-0">
                  <div className="flex gap-2 ml-auto">
                    <Button variant="secondary" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Progress
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

      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <div className="flex gap-3">
          <InfoIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-800">Personalized Wellness</h3>
            <p className="text-sm text-indigo-700">
              These wellness goals are generated based on your health profile, activity patterns, and health needs.
              Achieving these goals can help improve your overall health outcomes and quality of life.
              Update your progress regularly to stay on track.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
