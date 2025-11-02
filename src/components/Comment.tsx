import type { CommentWithAuthor } from "@/lib/definitions";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';

type Props = {
    comment: CommentWithAuthor;
}

export function Comment({ comment }: Props) {
    return (
        <div className="flex gap-3">
            <Link href={`/profile/${comment.author.id}`}>
                <UserAvatar user={comment.author} className="h-8 w-8" />
            </Link>
            <div className="bg-muted rounded-lg px-3 py-2 flex-1">
                <div className="flex justify-between items-center">
                    <Link href={`/profile/${comment.author.id}`}>
                        <p className="text-xs font-semibold hover:underline">{comment.author.name}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                </div>
                <p className="text-sm mt-1">{comment.text}</p>
            </div>
        </div>
    )
}
