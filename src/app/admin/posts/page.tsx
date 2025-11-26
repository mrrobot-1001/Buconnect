"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/AdminLayout";
import {
  Trash2,
  Edit2,
  FileText,
  LogOut,
  Loader2,
  Search,
  ArrowLeft,
  MoreVertical,
  Calendar,
  User,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author: { id: string; name: string; email: string; profile_image?: string };
  created_at: string;
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      const user = localStorage.getItem('currentUser');
      if (!user) {
        router.push('/');
        return;
      }

      const userData = JSON.parse(user);
      if (userData.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      setCurrentUser(userData);
      setIsAuthorized(true);
      await fetchPosts();
    };
    checkAuth();
  }, [router]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/posts?limit=500');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const handleUpdatePost = async (post: Post) => {
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          content: post.content
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setPosts(posts.map(p => p.id === post.id ? updated : p));
        setEditingPost(null);
        setEditDialogOpen(false);
      } else {
        alert('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
    post.content.toLowerCase().includes(postSearch.toLowerCase()) ||
    post.author.name.toLowerCase().includes(postSearch.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (!isAuthorized || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-600" />
                <h1 className="text-2xl font-bold">Post Management</h1>
              </div>
              <p className="text-muted-foreground text-sm">Moderate and manage platform content</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 w-full md:w-auto">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts by title, content, or author..."
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-orange-500">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={post.author.profile_image} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.author.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setEditingPost(post);
                          setEditDialogOpen(true);
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Post
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeletePost(post.id, post.title)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-semibold leading-tight group-hover:text-orange-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t mt-auto">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Content ID: {post.id.slice(0, 8)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <div className="bg-orange-50 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search terms</p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post Content</DialogTitle>
              <CardDescription>Update the title and content of this post</CardDescription>
            </DialogHeader>
            {editingPost && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={editingPost.content}
                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                    rows={8}
                    className="resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => editingPost && handleUpdatePost(editingPost)}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
