"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState, CardLoading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-boundary";
import { Bell, CheckCircle, AlertTriangle, Info, MessageCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedRecordId: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export default function NotificationsPanel() {
  const [notificationsData, setNotificationsData] = useState<NotificationsResponse>({
    notifications: [],
    unreadCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }
      
      setNotificationsData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark notification as read");
      }
      
      setNotificationsData(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (err: any) {
      console.error("Error marking notification as read:", err.message);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete notification");
      }
      
      setNotificationsData(prev => {
        const isRead = prev.notifications.find(n => n.id === id)?.isRead;
        return {
          notifications: prev.notifications.filter(notification => notification.id !== id),
          unreadCount: isRead ? prev.unreadCount : Math.max(0, prev.unreadCount - 1)
        };
      });
    } catch (err: any) {
      console.error("Error deleting notification:", err.message);
    }
  };

  const markAllAsRead = async () => {
    // For each unread notification, mark it as read
    const unreadNotifications = notificationsData.notifications.filter(n => !n.isRead);
    
    for (const notification of unreadNotifications) {
      try {
        await fetch(`/api/notifications/${notification.id}`, {
          method: "PATCH",
        });
      } catch (err) {
        console.error(`Failed to mark notification ${notification.id} as read`);
      }
    }
    
    // Update the local state
    setNotificationsData(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => ({
        ...notification,
        isRead: true
      })),
      unreadCount: 0
    }));
  };

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const baseClass = `h-6 w-6 ${isRead ? 'text-gray-400' : ''}`;
    
    switch (type) {
      case 'info':
        return <Info className={`${baseClass} ${isRead ? '' : 'text-blue-500'}`} />;
      case 'warning':
        return <AlertTriangle className={`${baseClass} ${isRead ? '' : 'text-yellow-500'}`} />;
      case 'alert':
        return <Bell className={`${baseClass} ${isRead ? '' : 'text-red-500'}`} />;
      case 'reminder':
        return <CheckCircle className={`${baseClass} ${isRead ? '' : 'text-green-500'}`} />;
      default:
        return <MessageCircle className={`${baseClass} ${isRead ? '' : 'text-purple-500'}`} />;
    }
  };

  const getNotificationClass = (type: string, isRead: boolean) => {
    if (isRead) return "bg-gray-50";
    
    switch (type) {
      case 'info':
        return "bg-blue-50 border-blue-100";
      case 'warning':
        return "bg-yellow-50 border-yellow-100";
      case 'alert':
        return "bg-red-50 border-red-100";
      case 'reminder':
        return "bg-green-50 border-green-100";
      default:
        return "bg-purple-50 border-purple-100";
    }
  };

  if (loading) {
    return <CardLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Stay updated on family health activities and important events.
          </CardDescription>
        </div>
        {notificationsData.unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={markAllAsRead}
            className="text-sm"
          >
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notificationsData.notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Notifications about your family's health activities will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notificationsData.notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`relative flex p-4 rounded-lg border ${getNotificationClass(notification.type, notification.isRead)}`}
              >
                <div className="mr-4 mt-0.5">
                  {getNotificationIcon(notification.type, notification.isRead)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {!notification.isRead && (
                        <Badge className="bg-blue-500">New</Badge>
                      )}
                      <button 
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Delete notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs h-8"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
