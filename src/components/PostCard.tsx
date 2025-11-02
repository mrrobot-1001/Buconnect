import type { PostWithAuthor } from "@/lib/definitions";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "./ui/button";
import { MessageCircle, ThumbsUp, Share2 } from "lucide-react";
import Image from "next/image";
import { Separator } from "./ui/separator";
import { mockComments } from "@/lib/mock-data";
import { Comment } from "./Comment";

type Props = {
  post: PostWithAuthor;
};

export function PostCard({ post }: Props) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex items-start gap-4">
          <Link href={`/profile/${post.author.id}`}>
            <UserAvatar user={post.author} />
          </Link>
          <div className="flex-1">
            <Link href={`/profile/${post.author.id}`}>
              <p className="font-semibold hover:underline">{post.author.name}</p>
            </Link>
            <p className="text-xs text-muted-foreground">
              {post.author.role === 'STUDENT' ? post.author.course : post.author.profession} &middot;{' '}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
            <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
                <Image src={post.imageUrl} alt={post.title} fill className="object-cover" data-ai-hint="post image"/>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4">
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground mb-2">
            <span>{post._count.likes} likes</span>
            <span>{post._count.comments} comments</span>
        </div>
        <Separator />
        <div className="grid grid-cols-3 w-full pt-1">
            <Button variant="ghost" className="text-muted-foreground">
                <ThumbsUp className="mr-2 h-4 w-4" /> Like
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
                <MessageCircle className="mr-2 h-4 w-4" /> Comment
            </Button>
            <Button variant="ghost" className="text-muted-foreground">
                <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
        </div>
        <Separator />
        <div className="w-full pt-4 space-y-4">
          {mockComments.filter(c => c.postId === post.id).map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
