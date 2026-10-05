"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserMinus, Loader2, Users, Check, X, MessageSquare, Inbox, Send } from "lucide-react";
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

const subtitle = (u: { role: string; profession?: string | null; course?: string | null }) =>
  u.role === 'ALUMNI' ? u.profession || 'Alumni' : u.course || 'Student';

function PersonRow({ person, meta, children }: { person: any; meta?: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4">
      <Link href={`/profile/${person.id}`} className="shrink-0">
        <UserAvatar user={person} className="h-12 w-12" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${person.id}`} className="block truncate font-semibold text-gray-900 hover:text-blue-600">
          {person.name}
        </Link>
        <p className="truncate text-sm text-gray-600">{subtitle(person)}</p>
        {meta && <p className="text-xs text-gray-400">{meta}</p>}
      </div>
      {/* Actions drop under the name on narrow phones */}
      <div className="flex w-full gap-2 pl-[3.75rem] sm:w-auto sm:pl-0">{children}</div>
    </li>
  );
}

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

  const pendingIncoming = incomingRequests.filter(r => r.status === 'PENDING');
  const pendingOutgoing = outgoingRequests.filter(r => r.status === 'PENDING');

  const list = "divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white";
  const loading = (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <AppLayout>
      <PageHeader title="Connections" description="Requests and the people you're connected with" icon={Users} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn(segmentedList, "grid-cols-3")}>
          <TabsTrigger value="requests" className={segmentedTrigger}>
            Requests
            {pendingIncoming.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">{pendingIncoming.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className={segmentedTrigger}>Sent</TabsTrigger>
          <TabsTrigger value="connections" className={segmentedTrigger}>
            Connected
            {connections.length > 0 && <span className="ml-1.5 text-xs text-gray-400">{connections.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          {isLoading ? loading : pendingIncoming.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending requests" description="New connection requests will show up here." />
          ) : (
            <ul className={list}>
              {pendingIncoming.map((request) => (
                <PersonRow key={request.id} person={request.follower} meta={`Requested ${new Date(request.createdAt).toLocaleDateString()}`}>
                  <Button className="h-10 flex-1 gap-1.5 rounded-full bg-blue-600 px-4 hover:bg-blue-700 sm:flex-none" onClick={() => handleAccept(request.id, request.follower.id)}>
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button variant="outline" className="h-10 flex-1 gap-1.5 rounded-full px-4 sm:flex-none" onClick={() => handleReject(request.id)}>
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </PersonRow>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          {isLoading ? loading : pendingOutgoing.length === 0 ? (
            <EmptyState icon={Send} title="No sent requests" description="Requests you send from Network appear here until they're answered." />
          ) : (
            <ul className={list}>
              {pendingOutgoing.map((request) => (
                <PersonRow key={request.id} person={request.following} meta={`Sent ${new Date(request.createdAt).toLocaleDateString()}`}>
                  <Button
                    variant="outline"
                    className="h-10 flex-1 rounded-full px-4 sm:flex-none"
                    onClick={() => handleCancel(request.following.id)}
                    disabled={connectingUsers.has(request.following.id)}
                  >
                    Withdraw
                  </Button>
                </PersonRow>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-4">
          {isLoading ? loading : connections.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connections yet"
              description="Connect with students and alumni to grow your network."
              action={
                <Button className="h-11 gap-2 rounded-full px-5" onClick={() => router.push('/network')}>
                  <UserPlus className="h-4 w-4" />
                  Find people
                </Button>
              }
            />
          ) : (
            <ul className={list}>
              {connections.map((user) => (
                <PersonRow key={user.id} person={user} meta={user.batch ? `Class of ${user.batch}` : undefined}>
                  <Button className="h-10 flex-1 gap-1.5 rounded-full bg-blue-600 px-4 hover:bg-blue-700 sm:flex-none" onClick={() => handleMessage(user.id)}>
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDisconnect(user.id, user.name)}
                    aria-label={`Remove ${user.name}`}
                    title="Remove connection"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </PersonRow>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
