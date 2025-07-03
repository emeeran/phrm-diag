'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Pill, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays, isBefore, parseISO } from 'date-fns';

interface MedicationRefillAlertsProps {
  alerts: any[];
  generateAlert: () => Promise<boolean>;
  dismissAlert: (id: string) => Promise<boolean>;
  isGenerating: boolean;
  showDismissed: boolean;
}

export default function MedicationRefillAlerts({
  alerts,
  generateAlert,
  dismissAlert,
  isGenerating,
  showDismissed
}: MedicationRefillAlertsProps) {
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

  // Get appropriate badge for days remaining
  const getDaysRemainingBadge = (daysRemaining: number) => {
    if (daysRemaining <= 3) {
      return <Badge variant="destructive">Urgent: {daysRemaining} days left</Badge>;
    } else if (daysRemaining <= 7) {
      return <Badge variant="default">Soon: {daysRemaining} days left</Badge>;
    } else {
      return <Badge variant="outline">In {daysRemaining} days</Badge>;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Medication Refill Alerts"
          description={
            showDismissed 
              ? "You don't have any medication refill alerts, including dismissed ones."
              : "You don't have any medication refill alerts at the moment."
          }
          icon={<Pill className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateAlert} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Checking...' : 'Check for Refills'}
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
          <h2 className="text-2xl font-bold">Medication Refill Alerts</h2>
          <p className="text-muted-foreground">
            Stay on top of your medication refills
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleGenerateAlert}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Checking...' : 'Check for Refills'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          // Parse JSON data if needed
          const alertData = typeof alert.data === 'string' ? JSON.parse(alert.data) : alert.data;
          const daysRemaining = alertData?.daysRemaining || 0;
          
          return (
            <Card 
              key={alert.id} 
              className={`
                ${alert.dismissed ? 'opacity-60' : ''} 
                ${daysRemaining <= 3 ? 'border-red-300 bg-red-50' : ''}
                ${daysRemaining > 3 && daysRemaining <= 7 ? 'border-orange-300 bg-orange-50' : ''}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    {alert.title || alertData?.medicationName || "Medication Refill"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getDaysRemainingBadge(daysRemaining)}
                    {alert.dismissed && (
                      <Badge variant="outline">Dismissed</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> 
                  Refill due: {format(
                    alertData?.refillDue 
                      ? parseISO(alertData.refillDue) 
                      : addDays(new Date(), daysRemaining),
                    'MMM d, yyyy'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p>{alert.description}</p>
                
                {alertData?.lastFilled && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Last filled: {format(parseISO(alertData.lastFilled), 'MMM d, yyyy')}
                  </div>
                )}
              </CardContent>
              {!alert.dismissed && (
                <CardFooter className="pt-0">
                  <div className="flex gap-2 ml-auto">
                    <Button variant="secondary" size="sm">
                      Refill Now
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

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Medication Adherence</h3>
            <p className="text-sm text-blue-700">
              Staying on top of medication refills is an important part of medication adherence.
              Running out of medication can lead to missed doses and potential health complications.
              Our system predicts when you'll need refills based on your prescription information and past refill patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
