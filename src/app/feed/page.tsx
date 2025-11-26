"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { CreatePostForm } from "@/components/CreatePostForm";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import type { PostWithAuthor } from "@/lib/definitions";

export default function FeedPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = () => {
    // Refresh posts after creating a new one
    fetchPosts();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <CreatePostForm onPostCreated={handlePostCreated} />
        <div className="space-y-4">
          {isLoading ? (
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse"></div>
                  <p className="text-gray-500">Loading posts...</p>
                </div>
              </CardContent>
            </Card>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📝</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
                    <p className="text-gray-600">Be the first to share something amazing!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
