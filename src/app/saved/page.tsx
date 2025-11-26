"use client";

import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { PostWithAuthor } from "@/lib/definitions";

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setIsLoading(true);
        const currentUserStr = localStorage.getItem('currentUser');
        if (!currentUserStr) {
          setIsLoading(false);
          return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const response = await fetch(`/api/posts/saved?userId=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setSavedPosts(data);
        }
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Saved Posts</CardTitle>
            <CardDescription>
              Your collection of saved posts for later reading
            </CardDescription>
          </CardHeader>
        </Card>

        {savedPosts.length === 0 ? (
          <Card className="border-0 shadow-sm bg-gray-50/50">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No saved posts yet</p>
              <p className="text-gray-400 text-sm mt-1">Save posts to view them here later</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
