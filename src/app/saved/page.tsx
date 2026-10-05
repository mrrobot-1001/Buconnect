"use client";

import AppLayout from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { PostSkeleton } from "@/components/PostSkeleton";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import type { PostWithAuthor } from "@/lib/definitions";

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts/saved', { cache: 'no-store', credentials: 'include' })
      .then(res => (res.ok ? res.json() : { posts: [] }))
      .then(data => setSavedPosts(data.posts || []))
      .catch(error => console.error('Error fetching saved posts:', error))
      .finally(() => setIsLoading(false));
  }, []);

  const remove = (postId: string) => setSavedPosts(prev => prev.filter(p => p.id !== postId));

  return (
    <AppLayout>
      <PageHeader title="Saved posts" description="Posts you've saved to read later" icon={Bookmark} />
      <div className="space-y-4">
        {isLoading ? (
          <PostSkeleton />
        ) : savedPosts.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Tap Save on any post to keep it here."
          />
        ) : (
          savedPosts.map(post => (
            <PostCard key={post.id} post={post} onDelete={remove} onUnsave={remove} />
          ))
        )}
      </div>
    </AppLayout>
  );
}
