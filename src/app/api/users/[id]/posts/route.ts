import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: id },
        include: {
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where: { authorId: id } }),
    ]);

    // Check which posts are liked by current user
    let likedPostIds = new Set<string>();
    if (currentUser) {
      const likes = await prisma.like.findMany({
        where: {
          userId: currentUser.id,
          postId: { in: posts.map(p => p.id) },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map(l => l.postId));
    }

    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    return NextResponse.json({ posts: postsWithLikes, total, limit, offset });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}