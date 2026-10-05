"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { Bell, CheckCheck, X, UserPlus, UserCheck, MessageCircle, FileText, Loader2, ThumbsUp } from "lucide-react";
import { PageHeader, EmptyState, segmentedList, segmentedTrigger } from "@/components/PageHeader";
import { cn, notificationHref } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    profileImage: string | null;
    role: string;
  };
  metadata?: {
    requestId?: string;
    connectionId?: string;
  };
}

export default function NotificationsPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/');
      return;
    }
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, authLoading]);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
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
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
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
        credentials: 'include',
        body: JSON.stringify({ read: true }),
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
    const previous = notifications;
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      });
      if (!res.ok) throw new Error('Failed to delete notification');
    } catch (error) {
      setNotifications(previous);
      toast({ title: "Couldn't remove notification", variant: "destructive" });
      console.error('Error deleting notification:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, notificationId: string) => {
    try {
      const response = await fetch('/api/connections/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        credentials: 'include',
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
    const href = notificationHref(notification.link);
    if (href) {
      router.push(href);
    }
  };

  const getNotificationIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'connection_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'connection_accepted':
        return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'new_post':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'like':
      case 'new_like':
        return <ThumbsUp className="h-5 w-5 text-blue-500" />;
      case 'comment':
      case 'new_comment':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'new_message':
      case 'message':
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const normalizedType = n.type.toLowerCase();
    if (activeTab === "unread") return !n.read;
    if (activeTab === "requests") return normalizedType === "connection_request";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const isRequest = (n: Notification) => n.type.toLowerCase() === "connection_request";

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        icon={Bell}
        action={
          unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="ghost" className="h-10 gap-1.5 rounded-full px-3 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Mark all read</span>
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn(segmentedList, "grid-cols-3")}>
          <TabsTrigger value="all" className={segmentedTrigger}>All</TabsTrigger>
          <TabsTrigger value="unread" className={segmentedTrigger}>
            Unread{unreadCount > 0 && <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="requests" className={segmentedTrigger}>Requests</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading || authLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={activeTab === "unread" ? "You're all caught up" : "No notifications"}
              description={activeTab === "unread" ? undefined : "We'll let you know when something happens."}
            />
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {filteredNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn("relative flex gap-3 p-3 sm:p-4", !notification.read && "bg-blue-50/60")}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="flex min-w-0 flex-1 gap-3 text-left"
                  >
                    <div className="relative shrink-0">
                      {notification.actor ? (
                        <UserAvatar user={notification.actor} className="h-12 w-12" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Bell className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-gray-100 [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm text-gray-900">
                        <span className="font-semibold">{notification.title}</span>
                        <span className="text-gray-600"> · {notification.message}</span>
                      </p>
                      <p className={cn("mt-1 text-xs", notification.read ? "text-gray-400" : "font-medium text-blue-600")}>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      {isRequest(notification) && !notification.read && (
                        <span className="mt-2 inline-flex h-9 items-center rounded-full bg-blue-600 px-4 text-sm font-medium text-white">
                          View request
                        </span>
                      )}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => deleteNotification(notification.id)}
                    aria-label="Remove notification"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
