"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Search, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/contexts/UserContext";

type Message = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string; profileImage: string | null };
  recipient: { id: string; name: string; profileImage: string | null };
};

type Conversation = {
  user: { id: string; name: string; profileImage: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

function MessagingContent() {
  const searchParams = useSearchParams();
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/messages?conversations=true`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [currentUser?.id]);

  // Load conversations when user is set
  useEffect(() => {
    if (currentUser?.id) {
      loadConversations();
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, loadConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (otherUserId: string) => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/messages?otherUserId=${otherUserId}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle userId query parameter to auto-select conversation
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && conversations.length > 0) {
      const conversation = conversations.find(c => c.user.id === userId);
      if (conversation) {
        setSelectedUser({
          id: conversation.user.id,
          name: conversation.user.name,
          profileImage: conversation.user.profileImage,
        });
        loadMessages(userId);
      }
    }
  }, [searchParams, conversations, loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser?.id) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          recipientId: selectedUser.id,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages([...messages, message]);
        setNewMessage("");
        loadConversations(); // Refresh conversations
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedUser({
      id: conv.user.id,
      name: conv.user.name,
      profileImage: conv.user.profileImage,
    });
    loadMessages(conv.user.id);
  };

  return (
    <AppLayout>
      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex h-[calc(100vh-16rem)]">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search conversations..." className="pl-9" />
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-22rem)]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start chatting with your connections!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-4 hover:bg-muted/50 transition-colors text-left ${selectedUser?.id === conv.user.id ? "bg-muted" : ""
                          }`}
                      >
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarImage src={conv.user.profileImage || undefined} />
                            <AvatarFallback>{conv.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold truncate">{conv.user.name}</p>
                              {conv.unreadCount > 0 && (
                                <Badge variant="default" className="ml-2">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden mr-2"
                        onClick={() => setSelectedUser(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar>
                        <AvatarImage src={selectedUser.profileImage || undefined} />
                        <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedUser.name}</p>
                        <p className="text-sm text-muted-foreground">Active now</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loading ? (
                      <div className="text-center text-muted-foreground py-8">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Send the first message!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUser?.id ? "justify-end" : "justify-start"
                              }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${message.senderId === currentUser?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                            >
                              <p>{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${message.senderId === currentUser?.id
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                                  }`}
                              >
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

import { Suspense } from "react";

export default function MessagingPage() {
  return (
    <Suspense fallback={<AppLayout><div className="flex items-center justify-center h-[calc(100vh-12rem)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div></AppLayout>}>
      <MessagingContent />
    </Suspense>
  );
}