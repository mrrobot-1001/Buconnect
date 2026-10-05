import type { CommentWithAuthor } from "@/lib/definitions";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';

type Props = {
    comment: CommentWithAuthor;
}

export function Comment({ comment }: Props) {
    const createdAt = comment.createdAt || comment.created_at;
    return (
        <div className="flex gap-2.5">
            <Link href={`/profile/${comment.author.id}`} className="shrink-0">
                <UserAvatar user={comment.author} className="h-8 w-8" />
            </Link>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/profile/${comment.author.id}`} className="truncate text-sm font-semibold text-gray-900 hover:underline">
                        {comment.author.name}
                    </Link>
                    <span className="shrink-0 text-xs text-gray-400">
                        {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">{comment.text}</p>
            </div>
        </div>
    )
}
