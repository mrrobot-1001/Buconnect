"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, UserMinus, Loader2, Users, Check, X, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  course: string | null;
  batch: number | null;
  profession: string | null;
}

interface ConnectionRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  follower: User;
  following: User;
}

type ConnectionStatus = 'NOT_CONNECTED' | 'PENDING' | 'CONNECTED' | 'INCOMING_PENDING';

export default function ConnectionsPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchConnectionData = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch connection requests
      const requestsRes = await fetch(`/api/connections/requests?userId=${currentUser.id}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
      }

      // Fetch connections (accepted requests/followers)
      const connectionsRes = await fetch(`/api/connections?userId=${currentUser.id}&type=followers`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching connection data:', error);
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchConnectionData();
    }
  }, [currentUser?.id, fetchConnectionData]);

  const handleAccept = async (requestId: string, userId: string) => {
    try {
      const res = await fetch('/api/connections/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, status: 'ACCEPTED' })
      });
      if (res.ok) {
        toast({ title: 'Request Accepted', description: 'You are now connected!' });
        fetchConnectionData();
      } else {
        throw new Error('Failed to accept');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch('/api/connections/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, status: 'REJECTED' })
      });
      if (res.ok) {
        toast({ title: 'Request Rejected' });
        fetchConnectionData();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject request', variant: 'destructive' });
    }
  };

  const handleCancel = async (userId: string) => {
    try {
      const res = await fetch('/api/connections/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: userId })
      });
      if (res.ok) {
        toast({ title: 'Request Cancelled' });
        fetchConnectionData();
      } else {
        throw new Error('Failed to cancel');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel request', variant: 'destructive' });
    }
  };

  const handleDisconnect = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${userName}?`)) return;
    
    try {
      const res = await fetch('/api/connections/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recipientId: userId })
      });
      if (res.ok) {
        toast({ title: 'Disconnected', description: `You have disconnected from ${userName}` });
        fetchConnectionData();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    }
  };

  const handleMessage = (userId: string) => {
    router.push(`/messaging?userId=${userId}`);
  };

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/network">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Connections</CardTitle>
                  <CardDescription>
                    Manage your connection requests and network
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl p-1">
            <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Requests {incomingRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {incomingRequests.filter(r => r.status === 'PENDING').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
              Sent
            </TabsTrigger>
            <TabsTrigger value="connections" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
              Connections {connections.length > 0 && (
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {connections.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Incoming Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                {isLoading ? (
                  <Card className="border-0 shadow-md bg-white/80">
                    <CardContent className="p-8 text-center text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p>Loading requests...</p>
                    </CardContent>
                  </Card>
                ) : incomingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-12 text-center">
                      <div className="text-6xl mb-4">📬</div>
                      <p className="text-gray-500 text-lg">No pending requests</p>
                      <p className="text-sm text-gray-400 mt-1">Connection requests will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {incomingRequests
                      .filter(r => r.status === 'PENDING')
                      .map((request) => (
                        <Card key={request.id} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Link href={`/profile/${request.follower.id}`}>
                                <UserAvatar user={request.follower} className="h-12 w-12 ring-2 ring-gray-100" />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link href={`/profile/${request.follower.id}`}>
                                  <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                    {request.follower.name}
                                  </h4>
                                </Link>
                                <p className="text-sm text-gray-500 truncate">
                                  {request.follower.role === 'ALUMNI' ? request.follower.profession : request.follower.course}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm"
                                  onClick={() => handleAccept(request.id, request.follower.id)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl shadow-sm"
                                  onClick={() => handleReject(request.id)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === "sent" && (
              <div className="space-y-4">
                {isLoading ? (
                  <Card className="border-0 shadow-md bg-white/80">
                    <CardContent className="p-8 text-center text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p>Loading...</p>
                    </CardContent>
                  </Card>
                ) : outgoingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                  <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-red-50">
                    <CardContent className="p-12 text-center">
                      <div className="text-6xl mb-4">📤</div>
                      <p className="text-gray-500 text-lg">No pending sent requests</p>
                      <p className="text-sm text-gray-400 mt-1">Your sent connection requests will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {outgoingRequests
                      .filter(r => r.status === 'PENDING')
                      .map((request) => (
                        <Card key={request.id} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Link href={`/profile/${request.following.id}`}>
                                <UserAvatar user={request.following} className="h-12 w-12 ring-2 ring-gray-100" />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link href={`/profile/${request.following.id}`}>
                                  <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                    {request.following.name}
                                  </h4>
                                </Link>
                                <p className="text-sm text-gray-500 truncate">
                                  {request.following.role === 'ALUMNI' ? request.following.profession : request.following.course}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Sent {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                                onClick={() => handleCancel(request.following.id)}
                                disabled={connectingUsers.has(request.following.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel Request
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === "connections" && (
              <div className="space-y-4">
                {isLoading ? (
                  <Card className="border-0 shadow-md bg-white/80">
                    <CardContent className="p-8 text-center text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p>Loading connections...</p>
                    </CardContent>
                  </Card>
                ) : connections.length === 0 ? (
                  <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-12 text-center">
                      <div className="text-6xl mb-4">🤝</div>
                      <p className="text-gray-500 text-lg">No connections yet</p>
                      <p className="text-sm text-gray-400 mt-1">Connect with people to start building your network</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => router.push('/network')}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Find People
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {connections.map((user) => (
                      <Card key={user.id} className="overflow-hidden border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all group">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center space-y-4">
                            <Link href={`/profile/${user.id}`}>
                              <UserAvatar
                                user={user}
                                className="h-20 w-20 cursor-pointer ring-4 ring-gray-100 group-hover:ring-blue-200 transition-all"
                              />
                            </Link>
                            <div className="space-y-1 w-full">
                              <Link href={`/profile/${user.id}`}>
                                <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors cursor-pointer">
                                  {user.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-gray-600 font-medium">
                                {user.role === "ALUMNI" ? user.profession || "Alumni" : user.course || "Student"}
                              </p>
                              {user.batch && (
                                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                  🎓 Class of {user.batch}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 w-full">
                              <Button
                                size="sm"
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm"
                                onClick={() => handleMessage(user.id)}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Message
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleDisconnect(user.id, user.name)}
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Disconnect
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}