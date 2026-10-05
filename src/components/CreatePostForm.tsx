"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

// Starts as a one-line prompt so phones see posts on the first screen;
// expands into the full composer when tapped.
export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { toast } = useToast();
  const { currentUser, isLoading: userLoading } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  if (userLoading || !currentUser) {
    return null;
  }

  const firstName = currentUser.name.split(" ")[0];

  const open = () => {
    setExpanded(true);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const reset = () => {
    setContent("");
    setTitle("");
    setImageUrl("");
    setShowImageInput(false);
    setExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim() || content.trim().substring(0, 50),
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create post');

      toast({ title: "Posted" });
      reset();
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Couldn't create post",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!expanded) {
    return (
      <Card className="border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={currentUser} className="h-10 w-10 shrink-0" />
          <button
            type="button"
            onClick={open}
            className="h-11 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 text-left text-[15px] text-gray-500 hover:bg-gray-100"
          >
            Start a post, {firstName}…
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full text-gray-500 hover:bg-blue-50 hover:text-blue-600"
            onClick={() => { open(); setShowImageInput(true); }}
            aria-label="Add an image"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={currentUser} className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{currentUser.name}</p>
            <p className="text-xs text-gray-500">Posting to everyone</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={reset} aria-label="Discard post">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Input
          ref={titleRef}
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="h-11 rounded-xl border-gray-200 bg-gray-50 font-medium"
        />
        <Textarea
          placeholder="What do you want to share?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] resize-y rounded-xl border-gray-200 bg-gray-50"
          rows={4}
        />
        {showImageInput && (
          <Input
            type="url"
            inputMode="url"
            placeholder="Image URL (https://…)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="h-11 rounded-xl border-gray-200 bg-gray-50"
          />
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            variant="ghost"
            onClick={() => setShowImageInput(!showImageInput)}
            type="button"
            className="h-11 gap-2 rounded-xl px-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-sm">Image</span>
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="h-11 min-w-[110px] gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 text-white shadow-sm hover:from-blue-600 hover:to-indigo-700"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
