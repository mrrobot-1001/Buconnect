import { prisma } from '@/lib/prisma';

// Adds the viewer's isLiked / isSaved flags to a page of posts (2 queries total).
export async function withViewerState<T extends { id: string }>(posts: T[], userId?: string | null) {
  if (!userId || posts.length === 0) {
    return posts.map(post => ({ ...post, isLiked: false, isSaved: false }));
  }

  const postIds = posts.map(p => p.id);
  const [likes, saves] = await Promise.all([
    prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
    prisma.savedPost.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
  ]);
  const liked = new Set(likes.map(l => l.postId));
  const saved = new Set(saves.map(s => s.postId));

  return posts.map(post => ({ ...post, isLiked: liked.has(post.id), isSaved: saved.has(post.id) }));
}

export const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      course: true,
      batch: true,
      profession: true,
    },
  },
  _count: { select: { likes: true, comments: true } },
} as const;
