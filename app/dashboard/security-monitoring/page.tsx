'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ShieldAlert, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SecurityEvent {
  id: string;
  eventType: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  createdAt: string;
  user?: { name?: string; email: string };
}

const SecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    unresolvedEvents: 0,
    recentEvents: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Fetch security events
    const fetchSecurityEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/security');
        
        if (!response.ok) {
          throw new Error('Failed to fetch security events');
        }
        
        const data = await response.json();
        setEvents(data.events || []);
        
        // Calculate stats
        const criticalEvents = data.events.filter((e: SecurityEvent) => e.severity === 'critical' || e.severity === 'high').length;
        const unresolvedEvents = data.events.filter((e: SecurityEvent) => !e.resolved).length;
        const recentEvents = data.events.filter((e: SecurityEvent) => {
          const eventDate = new Date(e.createdAt);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          return eventDate > oneDayAgo;
        }).length;
        
        setStats({
          totalEvents: data.events.length,
          criticalEvents,
          unresolvedEvents,
          recentEvents,
        });
      } catch (error) {
        console.error('Error fetching security events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load security events. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSecurityEvents();
    
    // Set up an interval to refresh data
    const interval = setInterval(fetchSecurityEvents, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [toast]);

  const markAsResolved = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/security/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolved: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update security event');
      }
      
      // Update local state
      setEvents(events.map(event => 
        event.id === id ? { ...event, resolved: true } : event
      ));
      
      toast({
        title: 'Success',
        description: 'Security event marked as resolved.',
      });
    } catch (error) {
      console.error('Error updating security event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update security event.',
        variant: 'destructive',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Monitoring</h1>
        <Link href="/dashboard/security/settings">
          <Button variant="outline">Security Settings</Button>
        </Link>
      </div>
      
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Security Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-gray-500" />
                <div className="text-3xl font-bold">{stats.totalEvents}</div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Critical Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5 text-red-500" />
                <div className="text-3xl font-bold">{stats.criticalEvents}</div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unresolved Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                <div className="text-3xl font-bold">{stats.unresolvedEvents}</div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Events (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                <div className="text-3xl font-bold">{stats.recentEvents}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="failed-logins">Failed Logins</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Security Summary</CardTitle>
              <CardDescription>Recent security events and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {stats.criticalEvents > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Critical Security Events Detected</AlertTitle>
                      <AlertDescription>
                        There are {stats.criticalEvents} critical security events that require your attention.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Security Events</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.slice(0, 5).map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>{event.eventType.replace(/_/g, ' ')}</TableCell>
                            <TableCell>
                              <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                                {event.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</TableCell>
                            <TableCell>
                              {event.resolved ? (
                                <Badge variant="outline" className="bg-green-100">Resolved</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100">Pending</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {events.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              No security events found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>All Security Events</CardTitle>
              <CardDescription>Comprehensive list of all security events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.eventType.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{event.user?.email || event.email || 'Unknown'}</TableCell>
                        <TableCell>{event.ipAddress || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</TableCell>
                        <TableCell>
                          {event.resolved ? (
                            <Badge variant="outline" className="bg-green-100">Resolved</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-100">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!event.resolved && (
                            <Button
                              size="sm"
                              onClick={() => markAsResolved(event.id)}
                              variant="outline"
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No security events found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="failed-logins">
          <Card>
            <CardHeader>
              <CardTitle>Failed Login Attempts</CardTitle>
              <CardDescription>Details of failed login attempts across the application</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events
                      .filter(e => e.eventType === 'failed_login')
                      .map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.email || 'Unknown'}</TableCell>
                          <TableCell>{event.ipAddress || 'Unknown'}</TableCell>
                          <TableCell>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</TableCell>
                          <TableCell>
                            {event.resolved ? (
                              <Badge variant="outline" className="bg-green-100">Resolved</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    
                    {events.filter(e => e.eventType === 'failed_login').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No failed login attempts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suspicious">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Activities</CardTitle>
              <CardDescription>Potential security threats and suspicious behaviors</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events
                      .filter(e => ['suspicious_activity', 'brute_force_attempt', 'vulnerability_attempt'].includes(e.eventType))
                      .map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.eventType.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{event.user?.email || event.email || 'Unknown'}</TableCell>
                          <TableCell>{event.ipAddress || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={`${getSeverityColor(event.severity)} text-white`}>
                              {event.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</TableCell>
                          <TableCell>
                            {!event.resolved && (
                              <Button
                                size="sm"
                                onClick={() => markAsResolved(event.id)}
                                variant="outline"
                              >
                                Mark Resolved
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    
                    {events.filter(e => ['suspicious_activity', 'brute_force_attempt', 'vulnerability_attempt'].includes(e.eventType)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No suspicious activities found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
