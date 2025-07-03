'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  FileText,
  Users,
  MessageCircle,
  Activity,
  AlertCircle,
  Settings,
  Sparkles,
  Bell,
  BarChart,
  Shield
} from 'lucide-react';

interface DashboardNavProps {
  className?: string;
}

export function DashboardNav({ className }: DashboardNavProps) {
  const pathname = usePathname();
  const [alertCount, setAlertCount] = useState(0);
  const [insightCount, setInsightCount] = useState(0);

  // Fetch alert and insight counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch alert count
        const alertsResponse = await fetch('/api/alerts');
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          const activeAlerts = (alertsData.alerts || []).filter((a: any) => !a.dismissed);
          setAlertCount(activeAlerts.length);
        }

        // Fetch insight count
        const insightsResponse = await fetch('/api/predictive');
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          const unreadInsights = (insightsData.insights || []).filter((i: any) => !i.isRead);
          setInsightCount(unreadInsights.length);
        }
      } catch (error) {
        console.error('Error fetching notification counts:', error);
      }
    };

    fetchCounts();
    
    // Set up a refresh interval (every 5 minutes)
    const intervalId = setInterval(fetchCounts, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Dashboard
            </h2>
            <nav className="space-y-1">
              <Link href="/dashboard">
                <Button
                  variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </Link>
              <Link href="/dashboard/records">
                <Button
                  variant={pathname?.includes('/dashboard/records') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Health Records
                </Button>
              </Link>
              <Link href="/dashboard/family">
                <Button
                  variant={pathname?.includes('/dashboard/family') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Family
                </Button>
              </Link>
              <Link href="/dashboard/chat">
                <Button
                  variant={pathname?.includes('/dashboard/chat') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Health Assistant
                </Button>
              </Link>
            </nav>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Insights
            </h2>
            <nav className="space-y-1">
              <Link href="/dashboard/analytics">
                <Button
                  variant={pathname === '/dashboard/analytics' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Link href="/dashboard/predictive">
                <Button
                  variant={pathname === '/dashboard/predictive' ? 'secondary' : 'ghost'}
                  className="w-full justify-start relative"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Predictive Insights
                  {insightCount > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                      {insightCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard/alerts">
                <Button
                  variant={pathname === '/dashboard/alerts' ? 'secondary' : 'ghost'}
                  className="w-full justify-start relative"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Smart Alerts
                  {alertCount > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                      {alertCount}
                    </span>
                  )}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Settings
            </h2>
            <nav className="space-y-1">
              <Link href="/dashboard/profile">
                <Button
                  variant={pathname === '/dashboard/profile' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </Button>
              </Link>
              <Link href="/dashboard/security">
                <Button
                  variant={pathname === '/dashboard/security' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Security & Privacy
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
