"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, UserMinus, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage: string | null;
    profile_image?: string | null;
    course: string | null;
    batch: number | null;
    profession: string | null;
}

interface ConnectionStatus {
    [userId: string]: 'NOT_CONNECTED' | 'PENDING' | 'CONNECTED' | 'INCOMING_PENDING';
}

export default function NetworkPage() {
    const router = useRouter();
    const { currentUser } = useUser();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
    const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());
    const [incomingRequests, setIncomingRequests] = useState<{ [userId: string]: string }>({}); // userId -> requestId
    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        try {
            const userId = currentUser?.id || null;

            // Fetch all users
            const response = await fetch('/api/users', {
                next: { revalidate: 60 }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out current user
                const filteredUsers = userId ? data.filter((u: User) => u.id !== userId) : data;
                setAllUsers(filteredUsers);

                // Fetch connection requests for current user
                if (userId) {
                    try {
                        const requestsRes = await fetch(`/api/connections/requests?userId=${userId}`);
                        if (requestsRes.ok) {
                            const { incoming, outgoing } = await requestsRes.json();
                            const statusMap: ConnectionStatus = {};
                            const incomingMap: { [userId: string]: string } = {};

                            // Initialize all users as not connected
                            filteredUsers.forEach((u: User) => {
                                statusMap[u.id] = 'NOT_CONNECTED';
                            });

                            // Update status based on outgoing requests
                            outgoing.forEach((req: any) => {
                                if (statusMap.hasOwnProperty(req.following_id)) {
                                    if (req.status === 'ACCEPTED') {
                                        statusMap[req.following_id] = 'CONNECTED';
                                    } else if (req.status === 'PENDING') {
                                        statusMap[req.following_id] = 'PENDING';
                                    }
                                }
                            });

                            // Also check incoming accepted requests
                            incoming.forEach((req: any) => {
                                if (req.status === 'ACCEPTED' && statusMap.hasOwnProperty(req.follower_id)) {
                                    statusMap[req.follower_id] = 'CONNECTED';
                                }
                                // If incoming request is pending, store requestId
                                if (req.status === 'PENDING' && statusMap.hasOwnProperty(req.follower_id)) {
                                    incomingMap[req.follower_id] = req.id;
                                    statusMap[req.follower_id] = 'INCOMING_PENDING';
                                }
                            });

                            setConnectionStatus(statusMap);
                            setIncomingRequests(incomingMap);
                        }
                    } catch (err) {
                        console.error('Error fetching connection requests:', err);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id, toast]);

    const handleConnect = async (userId: string, userName: string) => {
        if (!currentUser?.id) {
            router.push('/register');
            return;
        }

        const currentStatus = connectionStatus[userId] || 'NOT_CONNECTED';
        setConnectingUsers(prev => new Set(prev).add(userId));

        try {
            if (currentStatus === 'PENDING') {
                // Cancel pending request
                const res = await fetch('/api/connections/requests', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: currentUser.id,
                        recipient_id: userId
                    })
                });

                if (res.ok) {
                    setConnectionStatus(prev => ({ ...prev, [userId]: 'NOT_CONNECTED' }));
                    toast({
                        title: "Request Cancelled",
                        description: `Connection request to ${userName} has been cancelled`,
                    });
                } else {
                    throw new Error('Failed to cancel request');
                }
            } else if (currentStatus === 'CONNECTED') {
                // Disconnect
                const res = await fetch('/api/connections/requests', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: currentUser.id,
                        recipient_id: userId
                    })
                });

                if (res.ok) {
                    setConnectionStatus(prev => ({ ...prev, [userId]: 'NOT_CONNECTED' }));
                    toast({
                        title: "Disconnected",
                        description: `You have disconnected from ${userName}`,
                    });
                } else {
                    throw new Error('Failed to disconnect');
                }
            } else {
                // Send connection request
                const res = await fetch('/api/connections/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender_id: currentUser.id,
                        recipient_id: userId
                    })
                });

                if (res.ok) {
                    setConnectionStatus(prev => ({ ...prev, [userId]: 'PENDING' }));
                    toast({
                        title: "Request Sent!",
                        description: `Connection request sent to ${userName} 🚀`,
                    });
                } else {
                    throw new Error('Failed to send request');
                }
            }
        } catch (error) {
            console.error('Error toggling connection:', error);
            toast({
                title: "Error",
                description: "Failed to update connection status",
                variant: "destructive"
            });
        } finally {
            setConnectingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleAccept = async (userId: string) => {
        const requestId = incomingRequests[userId];
        if (!requestId) return;
        try {
            const res = await fetch('/api/connections/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'ACCEPTED' })
            });
            if (res.ok) {
                setConnectionStatus(prev => ({ ...prev, [userId]: 'CONNECTED' }));
                toast({ title: 'Connection Accepted', description: 'You are now connected!' });
                fetchUsers();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to accept request', variant: 'destructive' });
        }
    };

    const handleReject = async (userId: string) => {
        const requestId = incomingRequests[userId];
        if (!requestId) return;
        try {
            const res = await fetch('/api/connections/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'REJECTED' })
            });
            if (res.ok) {
                setConnectionStatus(prev => ({ ...prev, [userId]: 'NOT_CONNECTED' }));
                toast({ title: 'Request Rejected', description: 'Connection request rejected.' });
                fetchUsers();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to reject request', variant: 'destructive' });
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.profession?.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === "students") {
            return matchesSearch && user.role === "STUDENT";
        } else if (activeTab === "alumni") {
            return matchesSearch && user.role === "ALUMNI";
        }
        return matchesSearch && user.role !== "ADMIN";
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Network</CardTitle>
                                <CardDescription>
                                    Connect with students, alumni, and expand your network 🤝
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, email, course, or profession... 🔍"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                    <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-0 shadow-sm rounded-xl p-1">
                        <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
                            Students
                        </TabsTrigger>
                        <TabsTrigger value="alumni" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                            Alumni
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {isLoading ? (
                            <Card className="border-0 shadow-md bg-white/80">
                                <CardContent className="p-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                        <p>Loading users...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : filteredUsers.length === 0 ? (
                            <Card className="border-0 shadow-md bg-white/80">
                                <CardContent className="p-12 text-center">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <p className="text-gray-500">No users found</p>
                                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredUsers.map((user) => (
                                    <Card key={user.id} className="overflow-hidden border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all group">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col items-center text-center space-y-4">
                                                <Link href={`/profile/${user.id}`}>
                                                    <div className="relative">
                                                        <UserAvatar
                                                            user={user}
                                                            className="h-20 w-20 cursor-pointer ring-4 ring-gray-100 group-hover:ring-blue-200 transition-all"
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
                                                    </div>
                                                </Link>
                                                <div className="space-y-1 w-full">
                                                    <Link href={`/profile/${user.id}`}>
                                                        <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors cursor-pointer">
                                                            {user.name}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-sm text-gray-600 font-medium">
                                                        {user.role === "ALUMNI"
                                                            ? user.profession || "Alumni"
                                                            : user.course || "Student"}
                                                    </p>
                                                    {user.batch && (
                                                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                                            🎓 Class of {user.batch}
                                                        </p>
                                                    )}
                                                </div>
                                                {connectionStatus[user.id] === 'INCOMING_PENDING' ? (
                                                    <div className="flex gap-2 w-full">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                                                            onClick={() => handleAccept(user.id)}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 rounded-xl shadow-sm hover:shadow-md transition-all"
                                                            onClick={() => handleReject(user.id)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        className="w-full rounded-xl shadow-sm hover:shadow-md transition-all"
                                                        size="sm"
                                                        onClick={() => handleConnect(user.id, user.name)}
                                                        variant={connectionStatus[user.id] === 'PENDING' ? "outline" : connectionStatus[user.id] === 'CONNECTED' ? "outline" : "default"}
                                                        disabled={connectingUsers.has(user.id)}
                                                    >
                                                        {connectingUsers.has(user.id) ? (
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        ) : connectionStatus[user.id] === 'CONNECTED' ? (
                                                            <>
                                                                <UserMinus className="h-4 w-4 mr-2" />
                                                                Connected ✓
                                                            </>
                                                        ) : connectionStatus[user.id] === 'PENDING' ? (
                                                            <>
                                                                <UserMinus className="h-4 w-4 mr-2" />
                                                                Pending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus className="h-4 w-4 mr-2" />
                                                                Connect
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
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
