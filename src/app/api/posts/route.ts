import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/server';
import { applyRateLimit, postLimiter } from '@/lib/rate-limiter';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  imageUrl: z.string().url().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const hashtags = searchParams.get('hashtags');

    let where: any = {};
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (hashtags) {
      const tags = hashtags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tags.length > 0) {
        where.OR = tags.flatMap(tag => [
          { title: { contains: `#${tag}`, mode: 'insensitive' } },
          { content: { contains: `#${tag}`, mode: 'insensitive' } },
        ]);
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
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
      prisma.post.count({ where }),
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
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, postLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, content, imageUrl } = validation.data;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        authorId: currentUser.id,
      },
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
    });

    // Create notifications for followers
    const followers = await prisma.connection.findMany({
      where: { followingId: currentUser.id },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
      const notifications = followers.map(conn => ({
        userId: conn.followerId,
        type: 'new_post',
        title: 'New Post',
        message: `${post.author.name} posted: "${truncatedTitle}"`,
        actorId: currentUser.id,
        link: `/post/${post.id}`,
      }));

      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json(
      { ...post, isLiked: false },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}