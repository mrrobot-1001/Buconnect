"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Search, ArrowLeft, Loader2 } from "lucide-react";
import { format, formatDistanceToNowStrict, isToday } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

type ChatUser = { id: string; name: string; profileImage: string | null };

type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
};

type Conversation = {
  user: ChatUser;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

const POLL_MS = 5000;

// Fills the space between the fixed header and the bottom tab bar (phones)
// or the page bottom (md+), so only the message list scrolls.
const PANEL_HEIGHT =
  "h-[calc(100dvh-10rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-8.5rem)]";

function MessagingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?conversations=true`, { cache: 'no-store', credentials: 'include' });
      if (res.ok) setConversations(await res.json());
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  const loadMessages = useCallback(async (otherUserId: string) => {
    try {
      const res = await fetch(`/api/messages?otherUserId=${otherUserId}`, { cache: 'no-store', credentials: 'include' });
      if (res.ok) setMessages(await res.json());
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, []);

  // Conversation list, refreshed in the background
  useEffect(() => {
    if (!currentUser?.id) return;
    loadConversations();
    const interval = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(interval);
  }, [currentUser?.id, loadConversations]);

  // Open thread, refreshed in the background
  useEffect(() => {
    if (!selectedUser) return;
    let cancelled = false;
    setLoadingThread(true);
    setMessages([]);
    loadMessages(selectedUser.id).finally(() => !cancelled && setLoadingThread(false));
    const interval = setInterval(() => loadMessages(selectedUser.id), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedUser, loadMessages]);

  // ?userId=… opens that chat, even if you have never messaged them
  const requestedUserId = searchParams.get('userId');
  useEffect(() => {
    if (!requestedUserId || selectedUser?.id === requestedUserId || conversations === null) return;
    const existing = conversations.find(c => c.user.id === requestedUserId);
    if (existing) {
      setSelectedUser(existing.user);
      return;
    }
    fetch(`/api/users/${requestedUserId}`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(user => user && setSelectedUser({ id: user.id, name: user.name, profileImage: user.profileImage ?? null }))
      .catch(() => {});
  }, [requestedUserId, conversations, selectedUser?.id]);

  // Keep the newest message in view (scrolls only the thread, not the page)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, selectedUser?.id]);

  const openConversation = (user: ChatUser) => {
    setSelectedUser(user);
    router.replace(`/messaging?userId=${user.id}`, { scroll: false });
  };

  const closeConversation = () => {
    setSelectedUser(null);
    router.replace('/messaging', { scroll: false });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !selectedUser || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ recipientId: selectedUser.id, content }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        loadConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const filtered = (conversations || []).filter(c =>
    c.user.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className={cn("flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", PANEL_HEIGHT)}>
      {/* Conversation list */}
      <aside className={cn("w-full flex-col border-r border-gray-100 md:flex md:w-72 lg:w-80", selectedUser ? "hidden" : "flex")}>
        <div className="border-b border-gray-100 p-3">
          <h1 className="mb-2 px-1 text-lg font-bold text-gray-900">Messages</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-full border-gray-200 bg-gray-50 pl-9"
              aria-label="Search conversations"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {conversations === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              {conversations.length === 0 ? (
                <>
                  <p className="font-medium text-gray-700">No conversations yet</p>
                  <p className="mt-1">
                    Message someone from your{" "}
                    <Link href="/connections" className="text-blue-600 hover:underline">connections</Link>.
                  </p>
                </>
              ) : (
                "No matches"
              )}
            </div>
          ) : (
            <ul>
              {filtered.map((conv) => (
                <li key={conv.user.id}>
                  <button
                    onClick={() => openConversation(conv.user)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-gray-50",
                      selectedUser?.id === conv.user.id && "bg-blue-50/70 hover:bg-blue-50"
                    )}
                  >
                    <UserAvatar user={conv.user} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={cn("truncate text-[15px] text-gray-900", conv.unreadCount > 0 ? "font-bold" : "font-semibold")}>
                          {conv.user.name}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDistanceToNowStrict(new Date(conv.lastMessageAt))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm", conv.unreadCount > 0 ? "font-medium text-gray-900" : "text-gray-500")}>
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={cn("min-w-0 flex-1 flex-col", selectedUser ? "flex" : "hidden md:flex")}>
        {selectedUser ? (
          <>
            <header className="flex items-center gap-2 border-b border-gray-100 px-2 py-2 sm:px-3">
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full md:hidden" onClick={closeConversation} aria-label="Back to conversations">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link href={`/profile/${selectedUser.id}`} className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 hover:bg-gray-50">
                <UserAvatar user={selectedUser} className="h-10 w-10 shrink-0" />
                <span className="truncate font-semibold text-gray-900">{selectedUser.name}</span>
              </Link>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain bg-gray-50/60 px-3 py-4 sm:px-4">
              {loadingThread && messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">Say hello to {selectedUser.name.split(" ")[0]} 👋</p>
              ) : (
                <ol className="space-y-1.5">
                  {messages.map((message) => {
                    const mine = message.senderId === currentUser?.id;
                    const at = new Date(message.createdAt);
                    return (
                      <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm",
                            mine ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-gray-100 bg-white text-gray-900"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <time
                            dateTime={at.toISOString()}
                            className={cn("mt-0.5 block text-right text-[11px]", mine ? "text-blue-100" : "text-gray-400")}
                          >
                            {isToday(at) ? format(at, "p") : format(at, "d MMM, p")}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-gray-100 p-2 sm:p-3">
              <Input
                placeholder="Write a message…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="h-11 flex-1 rounded-full border-gray-200 bg-gray-50 px-4"
                aria-label="Message"
                autoComplete="off"
                enterKeyHint="send"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || sending}
                className="h-11 w-11 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
                aria-label="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-500">
            <MessageSquare className="mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-700">Your messages</p>
            <p className="text-sm">Pick a conversation to start chatting.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function MessagingPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        }
      >
        <MessagingContent />
      </Suspense>
    </AppLayout>
  );
}
