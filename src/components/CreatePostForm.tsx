"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Video, Send } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/definitions";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse currentUser:', e);
      }
    }
  }, []);

  if (!currentUser) {
    return null;
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please write something before posting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || content.substring(0, 50),
          content: content.trim(),
          imageUrl: imageUrl.trim() || null,
          authorId: currentUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      // Reset form
      setContent("");
      setTitle("");
      setImageUrl("");
      setShowImageInput(false);

      // Notify parent to refresh posts
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
      <CardContent className="p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create a Post</h2>
        <div className="flex gap-4">
          <UserAvatar user={currentUser} className="hidden sm:block" />
          <div className="w-full space-y-3">
            <Input
              placeholder="Give your post a title... ✨"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50/50 rounded-xl placeholder:text-gray-400"
            />
            <Textarea
              placeholder="What's on your mind? Share your thoughts... 💭"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50/50 rounded-xl resize-none placeholder:text-gray-400"
              rows={3}
            />
            {showImageInput && (
              <Input
                placeholder="Image URL (optional) 🖼️"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full text-sm bg-gray-50/50 border-gray-200 rounded-xl"
              />
            )}
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImageInput(!showImageInput)}
                  type="button"
                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? "Posting..." : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
