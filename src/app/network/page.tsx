"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, UserCheck, Loader2, Users, Check, X, Clock } from "lucide-react";
import { PageHeader, EmptyState, segmentedList, segmentedTrigger } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
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
            const response = await fetch('/api/users?limit=100', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const filteredUsers: User[] = (data.users || []).filter((u: User) => u.id !== userId);
                setAllUsers(filteredUsers);

                // Fetch connection requests for current user
                if (userId) {
                    try {
                        const requestsRes = await fetch(`/api/connections/requests?userId=${userId}`, {
                            credentials: 'include',
                        });
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
                                if (statusMap.hasOwnProperty(req.followingId)) {
                                    if (req.status === 'ACCEPTED') {
                                        statusMap[req.followingId] = 'CONNECTED';
                                    } else if (req.status === 'PENDING') {
                                        statusMap[req.followingId] = 'PENDING';
                                    }
                                }
                            });

                            // Also check incoming accepted requests
                            incoming.forEach((req: any) => {
                                if (req.status === 'ACCEPTED' && statusMap.hasOwnProperty(req.followerId)) {
                                    statusMap[req.followerId] = 'CONNECTED';
                                }
                                // If incoming request is pending, store requestId
                                if (req.status === 'PENDING' && statusMap.hasOwnProperty(req.followerId)) {
                                    incomingMap[req.followerId] = req.id;
                                    statusMap[req.followerId] = 'INCOMING_PENDING';
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
                    credentials: 'include',
                    body: JSON.stringify({
                        recipientId: userId
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
                    credentials: 'include',
                    body: JSON.stringify({
                        recipientId: userId
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
                    credentials: 'include',
                    body: JSON.stringify({
                        recipientId: userId
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
                credentials: 'include',
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
                credentials: 'include',
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

    const counts = {
        all: allUsers.filter(u => u.role !== "ADMIN").length,
        students: allUsers.filter(u => u.role === "STUDENT").length,
        alumni: allUsers.filter(u => u.role === "ALUMNI").length,
    };

    const renderAction = (user: User) => {
        const status = connectionStatus[user.id];
        const busy = connectingUsers.has(user.id);
        if (status === 'INCOMING_PENDING') {
            return (
                <div className="flex gap-2">
                    <Button size="icon" className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700" onClick={() => handleAccept(user.id)} aria-label={`Accept ${user.name}`}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-10 w-10 rounded-full" onClick={() => handleReject(user.id)} aria-label={`Decline ${user.name}`}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            );
        }
        return (
            <Button
                size="sm"
                onClick={() => handleConnect(user.id, user.name)}
                disabled={busy}
                variant={status === 'PENDING' || status === 'CONNECTED' ? "outline" : "default"}
                className={cn(
                    "h-10 min-w-[104px] gap-1.5 rounded-full px-4",
                    status === 'CONNECTED' && "border-green-200 text-green-700 hover:bg-green-50",
                    status === 'PENDING' && "text-gray-600",
                    (!status || status === 'NOT_CONNECTED') && "bg-blue-600 hover:bg-blue-700"
                )}
            >
                {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === 'CONNECTED' ? (
                    <><UserCheck className="h-4 w-4" />Connected</>
                ) : status === 'PENDING' ? (
                    <><Clock className="h-4 w-4" />Pending</>
                ) : (
                    <><UserPlus className="h-4 w-4" />Connect</>
                )}
            </Button>
        );
    };

    return (
        <AppLayout>
            <PageHeader title="Network" description="Find students and alumni to connect with" icon={Users} />

            <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    type="search"
                    placeholder="Search name, course or profession"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-white pl-10"
                    aria-label="Search people"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={cn(segmentedList, "grid-cols-3")}>
                    <TabsTrigger value="all" className={segmentedTrigger}>All ({counts.all})</TabsTrigger>
                    <TabsTrigger value="students" className={segmentedTrigger}>Students ({counts.students})</TabsTrigger>
                    <TabsTrigger value="alumni" className={segmentedTrigger}>Alumni ({counts.alumni})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <EmptyState icon={Search} title="No people found" description="Try a different name or filter." />
                    ) : (
                        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                            {filteredUsers.map((user) => (
                                <li key={user.id} className="flex items-center gap-3 p-3 sm:p-4">
                                    <Link href={`/profile/${user.id}`} className="shrink-0">
                                        <UserAvatar user={user} className="h-12 w-12" />
                                    </Link>
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/profile/${user.id}`} className="block truncate font-semibold text-gray-900 hover:text-blue-600">
                                            {user.name}
                                        </Link>
                                        <p className="truncate text-sm text-gray-600">
                                            {user.role === "ALUMNI" ? user.profession || "Alumni" : user.course || "Student"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {user.role === "ALUMNI" ? "Alumni" : "Student"}
                                            {user.batch ? ` · Class of ${user.batch}` : ""}
                                        </p>
                                    </div>
                                    {renderAction(user)}
                                </li>
                            ))}
                        </ul>
                    )}
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
