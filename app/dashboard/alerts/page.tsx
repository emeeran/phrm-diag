'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsLoading } from '@/components/ui/loading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle,
  Pill, 
  Award, 
  Target, 
  Bell, 
  FilterX,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

import HealthAnomalyAlerts from './components/health-anomaly-alerts';
import MedicationRefillAlerts from './components/medication-refill-alerts';
import HealthMilestoneAlerts from './components/health-milestone-alerts';
import WellnessGoalAlerts from './components/wellness-goal-alerts';

export default function AlertsDashboard() {
  const [activeTab, setActiveTab] = useState('anomaly');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAlert, setGeneratingAlert] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

  // Fetch alerts on mount and when filters change
  useEffect(() => {
    fetchAlerts();
  }, [activeTab, showDismissed]);

  // Fetch all alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const includeAll = showDismissed ? 'true' : 'false';
      const response = await fetch(`/api/alerts?type=${activeTab}&includeAll=${includeAll}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      
      // Filter alerts based on active tab
      filterAlerts(data.alerts || [], activeTab);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter alerts based on type
  const filterAlerts = (allAlerts: any[], type: string) => {
    if (type === 'all') {
      setFilteredAlerts(allAlerts);
    } else {
      const filtered = allAlerts.filter(alert => alert.alertType === type);
      setFilteredAlerts(filtered);
    }
  };

  // Generate a new alert
  const generateAlert = async (type: string) => {
    try {
      setGeneratingAlert(true);
      setError(null);
      
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate alert');
      }
      
      // Refresh alerts list
      await fetchAlerts();
      
      return true;
    } catch (err) {
      console.error('Error generating alert:', err);
      setError('Failed to generate alert. Please try again later.');
      return false;
    } finally {
      setGeneratingAlert(false);
    }
  };

  // Dismiss an alert
  const dismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dismissed: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to dismiss alert');
      }
      
      // Update local state without refetching
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      ));
      
      // Update filtered alerts
      setFilteredAlerts(filteredAlerts.map(alert => 
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      ));
      
      return true;
    } catch (err) {
      console.error('Error dismissing alert:', err);
      setError('Failed to dismiss alert. Please try again later.');
      return false;
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Count alerts by type
  const alertCounts = {
    anomaly: alerts.filter(a => a.alertType === 'anomaly' && !a.dismissed).length,
    refill: alerts.filter(a => a.alertType === 'refill' && !a.dismissed).length,
    milestone: alerts.filter(a => a.alertType === 'milestone' && !a.dismissed).length,
    wellness: alerts.filter(a => a.alertType === 'wellness' && !a.dismissed).length,
    all: alerts.filter(a => !a.dismissed).length
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Smart Health Alerts</h1>
          <p className="text-muted-foreground">
            Important notifications and alerts about your health
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDismissed(!showDismissed)}
            className="flex items-center"
          >
            {showDismissed ? (
              <>Hide Dismissed <FilterX className="ml-2 h-4 w-4" /></>
            ) : (
              <>Show All <Bell className="ml-2 h-4 w-4" /></>
            )}
          </Button>
          <Button
            onClick={() => generateAlert(activeTab)}
            disabled={generatingAlert}
          >
            {generatingAlert ? (
              <>Generating <RefreshCw className="ml-2 h-4 w-4 animate-spin" /></>
            ) : (
              <>Generate Alerts <Bell className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="anomaly" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:grid-cols-5 w-full">
          <TabsTrigger value="anomaly" className="relative">
            <AlertCircle className="h-4 w-4 mr-2" />
            Anomalies
            {alertCounts.anomaly > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {alertCounts.anomaly}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="refill" className="relative">
            <Pill className="h-4 w-4 mr-2" />
            Refills
            {alertCounts.refill > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {alertCounts.refill}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="milestone" className="relative">
            <Award className="h-4 w-4 mr-2" />
            Milestones
            {alertCounts.milestone > 0 && (
              <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {alertCounts.milestone}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="wellness" className="relative">
            <Target className="h-4 w-4 mr-2" />
            Goals
            {alertCounts.wellness > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {alertCounts.wellness}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="hidden md:flex relative">
            <Bell className="h-4 w-4 mr-2" />
            All Alerts
            {alertCounts.all > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {alertCounts.all}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {loading ? (
            <AnalyticsLoading message="Loading health alerts..." />
          ) : (
            <>
              <TabsContent value="anomaly" className="space-y-4">
                <HealthAnomalyAlerts 
                  alerts={filteredAlerts} 
                  generateAlert={() => generateAlert('anomaly')}
                  dismissAlert={dismissAlert}
                  isGenerating={generatingAlert}
                  showDismissed={showDismissed}
                />
              </TabsContent>

              <TabsContent value="refill" className="space-y-4">
                <MedicationRefillAlerts 
                  alerts={filteredAlerts} 
                  generateAlert={() => generateAlert('refill')}
                  dismissAlert={dismissAlert}
                  isGenerating={generatingAlert}
                  showDismissed={showDismissed}
                />
              </TabsContent>

              <TabsContent value="milestone" className="space-y-4">
                <HealthMilestoneAlerts 
                  alerts={filteredAlerts} 
                  generateAlert={() => generateAlert('milestone')}
                  dismissAlert={dismissAlert}
                  isGenerating={generatingAlert}
                  showDismissed={showDismissed}
                />
              </TabsContent>

              <TabsContent value="wellness" className="space-y-4">
                <WellnessGoalAlerts 
                  alerts={filteredAlerts} 
                  generateAlert={() => generateAlert('wellness')}
                  dismissAlert={dismissAlert}
                  isGenerating={generatingAlert}
                  showDismissed={showDismissed}
                />
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {alerts.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Bell className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium">No alerts found</h3>
                          <p className="text-sm text-gray-500 mt-2">
                            You don't have any health alerts at this time.
                          </p>
                          <Button 
                            className="mt-4" 
                            onClick={() => generateAlert('all')}
                            disabled={generatingAlert}
                          >
                            Generate All Alerts
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    alerts.map(alert => {
                      let Icon;
                      switch (alert.alertType) {
                        case 'anomaly': Icon = AlertCircle; break;
                        case 'refill': Icon = Pill; break;
                        case 'milestone': Icon = Award; break;
                        case 'wellness': Icon = Target; break;
                        default: Icon = Bell;
                      }
                      
                      return (
                        <Card 
                          key={alert.id} 
                          className={`${alert.dismissed ? 'opacity-60' : ''} ${alert.priority === 'high' || alert.priority === 'urgent' ? 'border-red-300' : ''}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${getAlertTypeColor(alert.alertType)}`}>
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <CardTitle>{alert.title}</CardTitle>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityVariant(alert.priority)}>
                                  {alert.priority}
                                </Badge>
                                {alert.dismissed && (
                                  <Badge variant="outline">Dismissed</Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="mt-1">
                              {format(new Date(alert.createdAt), 'MMM d, yyyy')}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>{alert.description}</p>
                          </CardContent>
                          {!alert.dismissed && (
                            <div className="px-6 pb-4 flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => dismissAlert(alert.id)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}

// Helper function to get color for alert type
function getAlertTypeColor(type: string) {
  switch (type) {
    case 'anomaly': return 'bg-red-500';
    case 'refill': return 'bg-orange-500';
    case 'milestone': return 'bg-blue-500';
    case 'wellness': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

// Helper function to get badge variant for priority
function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
}
