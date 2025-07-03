'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertCircle, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface HealthAnomalyAlertsProps {
  alerts: any[];
  generateAlert: () => Promise<boolean>;
  dismissAlert: (id: string) => Promise<boolean>;
  isGenerating: boolean;
  showDismissed: boolean;
}

export default function HealthAnomalyAlerts({
  alerts,
  generateAlert,
  dismissAlert,
  isGenerating,
  showDismissed
}: HealthAnomalyAlertsProps) {
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
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

  if (alerts.length === 0) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Health Anomalies Detected"
          description={
            showDismissed 
              ? "You don't have any anomaly alerts, including dismissed ones."
              : "No health anomalies have been detected in your data. This is a good sign!"
          }
          icon={<AlertCircle className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateAlert} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Checking...' : 'Check for Anomalies'}
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
          <h2 className="text-2xl font-bold">Health Anomaly Alerts</h2>
          <p className="text-muted-foreground">
            Potential health concerns detected in your data
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGenerateAlert}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Checking...' : 'Check for New Anomalies'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.map((alert, index) => (
          <Card 
            key={alert.id} 
            className={`
              ${alert.dismissed ? 'opacity-60' : ''} 
              ${(alert.priority === 'high' || alert.priority === 'urgent') ? 'border-red-300' : ''}
            `}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  {getPriorityIcon(alert.priority)}
                  {alert.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(alert.priority)}
                  {alert.dismissed && (
                    <Badge variant="outline">Dismissed</Badge>
                  )}
                </div>
              </div>
              <CardDescription className="mt-1">
                Detected on {format(new Date(alert.createdAt), 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="mb-4">{alert.description}</p>
              
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-1">Recommendation:</h4>
                <p className="text-amber-700 text-sm">{alert.recommendation || "Please consult with your healthcare provider about this potential health anomaly."}</p>
              </div>
              
              {alert.relatedRecords && alert.relatedRecords.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium mb-1">Related Health Records:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {alert.relatedRecords.map((record: string, i: number) => (
                      <li key={i} className="text-sm">{record}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            {!alert.dismissed && (
              <CardFooter className="pt-0">
                <div className="flex gap-2 ml-auto">
                  <Button variant="default" size="sm">
                    View Details
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
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">About Anomaly Detection</h3>
            <p className="text-sm text-blue-700">
              Our AI analyzes your health records to detect potential anomalies in your health patterns.
              This feature is designed to help identify potential health issues early, but is not a substitute
              for professional medical advice. Always consult with your healthcare provider about any health concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
