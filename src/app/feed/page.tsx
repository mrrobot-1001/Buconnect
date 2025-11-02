import AppLayout from "@/components/AppLayout";
import { CreatePostForm } from "@/components/CreatePostForm";
import { PostCard } from "@/components/PostCard";
import { mockPosts } from "@/lib/mock-data";

export default function FeedPage() {
  // In a real app, you would fetch posts from your database.
  const posts = mockPosts;

  return (
    <AppLayout>
      <div className="space-y-6">
        <CreatePostForm />
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
      </div>
    </AppLayout>
  );
}
