'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock, CheckCircle, CalendarClock } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

interface PreventiveCareRemindersProps {
  currentInsight: any;
  generateInsight: () => Promise<boolean>;
  isGenerating: boolean;
}

export default function PreventiveCareReminders({
  currentInsight,
  generateInsight,
  isGenerating
}: PreventiveCareRemindersProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateInsight = async () => {
    setLoading(true);
    await generateInsight();
    setLoading(false);
  };

  // Determine if a preventive care item is due
  const isDue = (dueDate: string) => {
    try {
      const date = parseISO(dueDate);
      return !isAfter(date, new Date());
    } catch (e) {
      return false;
    }
  };

  if (!currentInsight) {
    return (
      <div className="w-full">
        <EmptyState
          title="No Preventive Care Reminders"
          description="You don't have any preventive care reminders yet. Generate reminders to stay on top of your preventive health screenings and check-ups."
          icon={<Clock className="h-12 w-12" />}
          action={
            <Button onClick={handleGenerateInsight} disabled={isGenerating || loading}>
              {isGenerating || loading ? 'Generating...' : 'Generate Preventive Care Reminders'}
            </Button>
          }
        />
      </div>
    );
  }

  // Parse the JSON data
  const remindersData = typeof currentInsight.data === 'string'
    ? JSON.parse(currentInsight.data)
    : currentInsight.data;

  // Sort reminders by due date
  const sortedReminders = [...remindersData].sort((a, b) => {
    try {
      const dateA = parseISO(a.dueDate);
      const dateB = parseISO(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    } catch (e) {
      return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preventive Care Reminders</h2>
          <p className="text-muted-foreground">
            Generated on {format(new Date(currentInsight.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleGenerateInsight}
          disabled={isGenerating || loading}
        >
          {isGenerating || loading ? 'Updating...' : 'Update Reminders'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedReminders.map((reminder: any, index: number) => (
          <Card 
            key={index} 
            className={isDue(reminder.dueDate) ? 'border-orange-300 bg-orange-50' : ''}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{reminder.checkupType}</CardTitle>
                {isDue(reminder.dueDate) ? (
                  <Badge variant="destructive">Due Now</Badge>
                ) : (
                  <Badge variant="outline">Upcoming</Badge>
                )}
              </div>
              <CardDescription className="flex items-center mt-1">
                <CalendarClock className="h-4 w-4 mr-2" />
                Due: {format(parseISO(reminder.dueDate), 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p>{reminder.description}</p>
                
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Frequency:</span>
                    <span>{reminder.frequency}</span>
                  </div>
                  
                  {reminder.lastCompleted && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">Last completed:</span>
                      <span>{reminder.lastCompleted}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <h4 className="font-medium mb-1">Risk Reduction:</h4>
                  <p className="text-sm text-gray-700">{reminder.riskReduction}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-end">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
                <Button size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">Why Preventive Care Matters</h3>
            <p className="text-sm text-green-700">
              Regular preventive care helps detect health issues before they become serious.
              Staying on top of these screenings and check-ups can significantly improve health 
              outcomes and reduce healthcare costs over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
