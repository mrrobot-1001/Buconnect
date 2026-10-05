"use client";

import type { PostWithAuthor } from "@/lib/definitions";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "./ui/button";
import { MessageCircle, ThumbsUp, MoreHorizontal, Send, Bookmark, Share2, Trash2, Link2, Loader2 } from "lucide-react";
import { Comment } from "./Comment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

type Props = {
  post: PostWithAuthor;
  onDelete?: (postId: string) => void;
  onUnsave?: (postId: string) => void;
  defaultShowComments?: boolean;
};

type CommentType = {
  id: string;
  text: string;
  authorId: string;
  postId: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null; role: string };
};

// Posts longer than this start collapsed behind "See more"
const COLLAPSE_AT = 280;

export function PostCard({ post, onDelete, onUnsave, defaultShowComments = false }: Props) {
  const { toast } = useToast();
  const { currentUser } = useUser();

  const isAuthor = currentUser?.id === post.author.id;
  const canComment = !!currentUser && !isAuthor;

  const [likes, setLikes] = useState(post._count?.likes || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [commentCount, setCommentCount] = useState(post._count?.comments || 0);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [comments, setComments] = useState<CommentType[] | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [expanded, setExpanded] = useState(post.content.length <= COLLAPSE_AT);

  const postUrl = `/post/${post.id}`;
  const subtitle = post.author.role === 'ALUMNI' ? post.author.profession : post.author.course;
  const createdAt = new Date((post as any).created_at || post.createdAt);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, { credentials: 'include' });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) loadComments();
  };

  // The single-post page opens with comments loaded
  useEffect(() => {
    if (defaultShowComments) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLike = async () => {
    if (isLiking || !currentUser) return;
    setIsLiking(true);
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikes(n => n + (wasLiked ? -1 : 1));

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to like post');
    } catch (error) {
      setIsLiked(wasLiked);
      setLikes(n => n + (wasLiked ? 1 : -1));
      console.error('Error liking post:', error);
      toast({ title: "Couldn't update like", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to save post');
      toast({ title: wasSaved ? "Removed from saved" : "Saved for later" });
      if (wasSaved) onUnsave?.(post.id);
    } catch (error) {
      setIsSaved(wasSaved);
      console.error('Error saving post:', error);
      toast({ title: "Couldn't save post", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${postUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch {
        // Share sheet dismissed
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (!response.ok) throw new Error('Failed to post comment');

      const newComment = await response.json();
      setComments(prev => [newComment, ...(prev || [])]);
      setCommentCount(n => n + 1);
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({ title: "Couldn't post comment", variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      toast({ title: "Post deleted" });
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: "Couldn't delete post", variant: "destructive" });
    }
  };

  const actionClass = "h-11 gap-2 rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-100";

  return (
    <Card className="overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Author */}
      <div className="flex items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <Link href={`/profile/${post.author.id}`} className="shrink-0">
          <UserAvatar user={post.author} className="h-11 w-11" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.id}`} className="block truncate text-[15px] font-semibold text-gray-900 hover:text-blue-600">
            {post.author.name}
          </Link>
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {subtitle && <span aria-hidden="true">•</span>}
            <time dateTime={createdAt.toISOString()} className="shrink-0">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </time>
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-10 w-10 shrink-0 rounded-full" aria-label="Post options">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 rounded-xl" align="end">
            <DropdownMenuItem className="cursor-pointer py-2.5" onClick={handleSave}>
              <Bookmark className="mr-2 h-4 w-4" />
              {isSaved ? 'Remove from saved' : 'Save post'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2.5"
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}${postUrl}`);
                toast({ title: "Link copied" });
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            {isAuthor && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer py-2.5 text-red-600 focus:text-red-700" onClick={handleDeletePost}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 sm:px-5">
        <Link href={postUrl} className="block">
          <h3 className="break-words text-base font-semibold leading-snug text-gray-900 hover:text-blue-600 sm:text-lg">
            {post.title}
          </h3>
        </Link>
        <p className={cn("mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-700", !expanded && "line-clamp-5")}>
          {post.content}
        </p>
        {!expanded && (
          <button onClick={() => setExpanded(true)} className="mt-1 text-sm font-medium text-gray-500 hover:text-gray-800">
            See more
          </button>
        )}
      </div>
      {post.imageUrl && (
        // Plain img: posts may link images from any host, which next/image would reject
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          loading="lazy"
          className="mt-3 max-h-[480px] w-full bg-gray-50 object-cover"
        />
      )}

      {/* Counts */}
      {(likes > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 pt-3 text-xs text-gray-500 sm:px-5">
          <span className="flex items-center gap-1">
            {likes > 0 && (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                  <ThumbsUp className="h-3 w-3 fill-current" />
                </span>
                {likes}
              </>
            )}
          </span>
          {commentCount > 0 && (
            <button onClick={toggleComments} className="hover:text-gray-800 hover:underline">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mx-2 mt-2 grid grid-cols-4 border-t border-gray-100 py-1 sm:mx-3">
        <Button
          variant="ghost"
          className={cn(actionClass, isLiked && "text-blue-600 hover:text-blue-700")}
          onClick={handleLike}
          aria-pressed={isLiked}
        >
          <ThumbsUp className={cn("h-5 w-5", isLiked && "fill-current")} />
          <span className="hidden min-[375px]:inline">Like</span>
        </Button>
        <Button variant="ghost" className={actionClass} onClick={toggleComments} aria-expanded={showComments}>
          <MessageCircle className="h-5 w-5" />
          <span className="hidden min-[375px]:inline">Comment</span>
        </Button>
        <Button
          variant="ghost"
          className={cn(actionClass, isSaved && "text-blue-600 hover:text-blue-700")}
          onClick={handleSave}
          aria-pressed={isSaved}
        >
          <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
          <span className="hidden min-[375px]:inline">{isSaved ? 'Saved' : 'Save'}</span>
        </Button>
        <Button variant="ghost" className={actionClass} onClick={handleShare}>
          <Share2 className="h-5 w-5" />
          <span className="hidden min-[375px]:inline">Share</span>
        </Button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-4 border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-5">
          {canComment ? (
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
              <UserAvatar user={currentUser!} className="hidden h-9 w-9 shrink-0 sm:flex" />
              <Input
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSubmittingComment}
                className="h-11 rounded-full border-gray-200 bg-white"
                aria-label="Write a comment"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSubmittingComment || !commentText.trim()}
                className="h-11 w-11 shrink-0 rounded-full bg-blue-500 hover:bg-blue-600"
                aria-label="Post comment"
              >
                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : isAuthor ? (
            <p className="text-center text-sm text-gray-500">You can't comment on your own post</p>
          ) : null}

          {comments === null ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map(comment => (
                <Comment key={comment.id} comment={comment as any} />
              ))}
            </div>
          ) : (
            <p className="py-2 text-center text-sm text-gray-500">
              No comments yet.{canComment ? ' Be the first!' : ''}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
