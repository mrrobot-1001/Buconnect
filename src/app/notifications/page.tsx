"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { Bell, Check, X, Trash2, UserPlus, UserCheck, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  actor?: {
    id: string;
    name: string;
    profile_image: string | null;
    role: string;
  };
  metadata?: {
    request_id?: string;
    connection_id?: string;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast({
          title: "All notifications marked as read ✓",
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE',
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: "Notification deleted",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, notificationId: string) => {
    try {
      const response = await fetch('/api/connections/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'ACCEPTED' }),
      });

      if (response.ok) {
        toast({
          title: "Request Accepted! 🎉",
          description: "You are now connected",
        });
        markAsRead(notificationId);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string, notificationId: string) => {
    try {
      const response = await fetch('/api/connections/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'REJECTED' }),
      });

      if (response.ok) {
        toast({
          title: "Request Rejected",
        });
        markAsRead(notificationId);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'CONNECTION_ACCEPTED':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'MESSAGE':
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "requests") return n.type === "CONNECTION_REQUEST";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Notifications</CardTitle>
                  <CardDescription>
                    Stay updated with your connections and activity
                  </CardDescription>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl p-1">
            <TabsTrigger
              value="all"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <Card className="border-0 shadow-md bg-white/80">
                <CardContent className="p-12 text-center text-gray-500">
                  Loading notifications...
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No notifications</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {activeTab === "unread"
                      ? "You're all caught up! 🎉"
                      : "We'll notify you when something happens"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-0 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                      !notification.read
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                        : "bg-white/80"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        {notification.actor && (
                          <UserAvatar
                            user={notification.actor}
                            className="h-12 w-12 ring-2 ring-gray-100"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <h4 className="font-semibold text-gray-900">
                                {notification.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>

                          {/* Connection Request Actions */}
                          {notification.type === "CONNECTION_REQUEST" &&
                            !notification.read &&
                            notification.metadata?.request_id && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptRequest(
                                      notification.metadata!.request_id!,
                                      notification.id
                                    );
                                  }}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-md"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Accept Request
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectRequest(
                                      notification.metadata!.request_id!,
                                      notification.id
                                    );
                                  }}
                                  className="rounded-xl"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Decline
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
