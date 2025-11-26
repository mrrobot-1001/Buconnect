"use client";

import type { PostWithAuthor } from "@/lib/definitions";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "./ui/button";
import { MessageCircle, ThumbsUp, MoreHorizontal, Send } from "lucide-react";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { mockComments, mockUsers } from "@/lib/mock-data";
import { Comment } from "./Comment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";

type Props = {
  post: PostWithAuthor;
};

type CommentType = {
  id: string;
  text: string;
  authorId: string;
  postId: string;
  createdAt: Date;
  author: { id: string; name: string; profileImage: string | null };
};

export function PostCard({ post }: Props) {
  const { toast } = useToast();
  const [currentUserFromStorage, setCurrentUserFromStorage] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        setCurrentUserFromStorage(JSON.parse(userStr));
      }
    }
  }, []);

  const currentUser = currentUserFromStorage || mockUsers[1]; // Fallback to mock if needed
  const isAuthor = currentUserFromStorage?.id === post.author.id;
  const canComment = currentUserFromStorage?.id !== post.author.id;

  const [likes, setLikes] = useState(post._count?.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentType[]>(
    mockComments.filter(c => c.postId === post.id) as CommentType[]
  );
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    toast({
      title: isLiked ? "Unliked" : "Liked",
      description: isLiked ? "Post removed from your likes" : "Post added to your likes",
    });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingComment(true);

    try {
      // Simulate API call
      setTimeout(() => {
        const newComment: CommentType = {
          id: `comment${Date.now()}`,
          text: commentText.trim(),
          authorId: currentUser.id,
          postId: post.id,
          createdAt: new Date(),
          author: {
            id: currentUser.id,
            name: currentUser.name,
            profileImage: currentUser.profileImage || null,
          },
        };

        setComments([newComment, ...comments]);
        setCommentText('');

        toast({
          title: "Success",
          description: "Comment posted successfully",
        });

        setIsSubmittingComment(false);
      }, 500);
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
      setIsSubmittingComment(false);
    }
  };



  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });

      // Optionally refresh the page or remove the post from the list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };
  return (
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author.id}`}>
            <UserAvatar user={post.author} className="ring-2 ring-gray-100 hover:ring-blue-200 transition-all" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${post.author.id}`}>
              <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm">{post.author.name}</p>
            </Link>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
              <span>{post.author.role === 'STUDENT' ? post.author.course : post.author.profession}</span>
              <span className="text-gray-300">•</span>
              <span>{formatDistanceToNow(new Date((post as any).created_at || post.createdAt), { addSuffix: true })}</span>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-lg" align="end">
              {isAuthor && (
                <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleDeletePost}>
                  Delete Post
                </DropdownMenuItem>
              )}
              {!isAuthor && (
                <>
                  <DropdownMenuItem className="cursor-pointer">Save post</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Report post</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-3">
        <h3 className="font-semibold text-lg mb-2 text-gray-800">{post.title}</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-4 relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
            <Image src={post.imageUrl} alt={post.title} fill className="object-cover" data-ai-hint="post image" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start p-3 sm:p-5">
        <div className="flex justify-between items-center w-full text-xs text-gray-500 mb-3 px-2 sm:px-0">
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-xs">👍</span>
            {likes} {likes === 1 ? 'like' : 'likes'}
          </span>
          <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
        </div>
        <Separator className="bg-gray-100" />
        <div className="grid grid-cols-2 w-full pt-1 gap-1">
          <Button
            variant="ghost"
            className={`text-gray-600 rounded-xl transition-all ${isLiked
              ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              : 'hover:text-blue-600 hover:bg-blue-50'
              }`}
            onClick={handleLike}
          >
            <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Like</span>
          </Button>
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Comment</span>
          </Button>

        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="w-full pt-4 space-y-4 px-2 sm:px-0">
            <Separator className="bg-gray-100" />

            {/* Comment Input - Only show if user is not the author */}
            {canComment ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2 items-start">
                <UserAvatar user={currentUser} className="h-8 w-8 mt-2" />
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmittingComment}
                    className="rounded-full border-gray-200 focus-visible:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="rounded-full bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">You can't comment on your own post</p>
              </div>
            )}

            {/* Existing Comments */}
            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.map(comment => (
                  <Comment key={comment.id} comment={comment as any} />
                ))}
              </div>
            )}

            {comments.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No comments yet. {canComment ? 'Be the first to comment!' : ''}</p>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
