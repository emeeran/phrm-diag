"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function NotificationIndicator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?unread=true&limit=1");
        const data = await response.json();
        
        if (response.ok) {
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Set up polling every minute to check for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <Link href="/dashboard/notifications">
      <div className="relative inline-flex items-center p-1">
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </div>
    </Link>
  );
}
