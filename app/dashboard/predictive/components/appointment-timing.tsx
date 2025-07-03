'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentTimingProps {
  currentInsight: any;
  generateInsight: () => Promise<boolean>;
  isGenerating: boolean;
}

export default function AppointmentTiming({
  currentInsight,
  generateInsight,
  isGenerating
}: AppointmentTimingProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateInsight = async () => {
    setLoading(true);
    await generateInsight();
    setLoading(false);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return (
          <Badge variant="destructive" className="ml-auto">
            <AlertCircle className="h-3 w-3 mr-1" /> Urgent
          </Badge>
        );
      case 'soon':
        return <Badge variant="default" className="ml-auto">Soon</Badge>;
      case 'routine':
        return <Badge variant="outline" className="ml-auto">Routine</Badge>;
      default:
        return null;
    }
  };

  if (!currentInsight) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Appointment Timing Insights"
          description="You don't have any appointment timing recommendations yet. Generate insights to find the optimal timing for your medical appointments."
          icon={<Calendar className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateInsight} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Generating...' : 'Generate Appointment Timing'}
            </Button>
          }
        />
      </div>
    );
  }

  // Parse the JSON data
  const appointmentsData = typeof currentInsight.data === 'string'
    ? JSON.parse(currentInsight.data)
    : currentInsight.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Optimal Appointment Timing</h2>
          <p className="text-muted-foreground">
            Generated on {format(new Date(currentInsight.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleGenerateInsight}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Updating...' : 'Update Timing'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointmentsData.map((appointment: any, index: number) => (
          <Card key={index} className={appointment.urgency === 'urgent' ? 'border-red-300' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>{appointment.specialistType}</CardTitle>
                {getUrgencyBadge(appointment.urgency)}
              </div>
              <CardDescription className="flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                Recommended by: {appointment.recommendedDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Reason:</h4>
                  <p className="text-gray-700">{appointment.reason}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Health Context:</h4>
                  <p className="text-gray-700">{appointment.healthContext}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-end">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
                <Button variant="secondary" size="sm">
                  Schedule Now
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <div className="flex gap-3">
          <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Appointment Timing Note</h3>
            <p className="text-sm text-amber-700">
              These recommendations are based on your health history and optimal timing for check-ups.
              For urgent health concerns, please contact your healthcare provider immediately rather than waiting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
