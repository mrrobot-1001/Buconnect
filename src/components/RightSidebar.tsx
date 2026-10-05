"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import { UserPlus, Check, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import OpportunityBox from "./OpportunityBox";

interface RecommendedUser {
  id: string;
  name: string;
  profileImage?: string | null;
  profile_image?: string | null;
  profession: string | null;
  course: string | null;
  role: string;
  batch?: number | null;
}

export default function RightSidebar() {
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{ [userId: string]: 'PENDING' | 'ACCEPTED' | null }>({});
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useUser();

  const fetchRecommendedUsers = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Fetch all users
      const response = await fetch('/api/users', {
        next: { revalidate: 60 },
        credentials: 'include',
      });
      if (!response.ok) return;

      const allUsersData = await response.json();
      const allUsers = allUsersData.users || [];

      // Fetch current connections
      const connectionsRes = await fetch(`/api/connections?userId=${currentUser.id}&type=following`, {
        credentials: 'include',
      });
      const connectionsData = connectionsRes.ok ? await connectionsRes.json() : [];
      const connections = Array.isArray(connectionsData) ? connectionsData : [];
      const connectedIds = new Set(connections.map((u: any) => u.id));

      // Fetch pending requests
      const requestsRes = await fetch(`/api/connections/requests?userId=${currentUser.id}`, {
        credentials: 'include',
      });
      const requestsData = requestsRes.ok ? await requestsRes.json() : { incoming: [], outgoing: [] };
      const incomingRequests = requestsData.incoming || [];
      const outgoingRequests = requestsData.outgoing || [];

      // Create status map
      const statusMap: { [userId: string]: 'PENDING' | 'ACCEPTED' | null } = {};
      outgoingRequests.forEach((req: any) => {
        statusMap[req.followingId] = req.status;
      });
      connections.forEach((u: any) => {
        statusMap[u.id] = 'ACCEPTED';
      });

      setConnectionStatus(statusMap);

      // Filter recommended users (not connected and not current user)
      const recommended = allUsers
        .filter((u: RecommendedUser) =>
          u.id !== currentUser.id &&
          !connectedIds.has(u.id) &&
          u.role !== 'ADMIN'
        )
        .slice(0, 6);

      setRecommendedUsers(recommended);
    } catch (error) {
      console.error('Error fetching recommended users:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && pathname === '/network') {
      fetchRecommendedUsers();
    }
  }, [currentUser, pathname, fetchRecommendedUsers]);

  const handleConnect = async (userId: string, userName: string) => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    setLoadingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch('/api/connections/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: userId
        }),
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, [userId]: 'PENDING' }));
        toast({
          title: "Request Sent! 📤",
          description: `Connection request sent to ${userName}`,
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send connection request",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleMessage = (userId: string) => {
    router.push(`/messaging?userId=${userId}`);
  };

  // Show on network and feed pages
  if ((pathname !== '/network' && pathname !== '/feed') || !currentUser) {
    return null;
  }

  if (pathname === '/feed') {
    return (
      <div className="space-y-4">
        <OpportunityBox />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="p-5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Recommended for You ✨</CardTitle>
          </div>
          <CardDescription className="text-sm">People you may want to connect with</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          {recommendedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No recommendations</p>
            </div>
          ) : (
            recommendedUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all">
                <Link href={`/profile/${user.id}`}>
                  <UserAvatar user={user} className="h-12 w-12 ring-2 ring-gray-100 hover:ring-blue-200 transition-all" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`}>
                    <h4 className="text-sm font-semibold hover:text-blue-600 transition-colors truncate">
                      {user.name}
                    </h4>
                  </Link>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role === 'ALUMNI' ? user.profession : user.course}
                  </p>
                </div>
                <div className="flex gap-1">
                  {connectionStatus[user.id] === 'ACCEPTED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 shrink-0 rounded-full p-0 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      onClick={() => handleMessage(user.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  ) : connectionStatus[user.id] === 'PENDING' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 shrink-0 rounded-full p-0 border-orange-200 bg-orange-50 text-orange-700"
                      disabled
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 w-10 shrink-0 rounded-full p-0 border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleConnect(user.id, user.name)}
                      disabled={loadingUsers.has(user.id)}
                    >
                      {loadingUsers.has(user.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}