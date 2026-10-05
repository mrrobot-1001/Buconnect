import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth/server';
import { z } from 'zod';

const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(2000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({ where: { postId: id } }),
    ]);

    return NextResponse.json({ comments, total, limit, offset });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();
    const body = await request.json();
    
    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { text } = validation.data;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        authorId: currentUser.id,
        postId: id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    // Create notification for post author (if not self-comment)
    if (post.authorId !== currentUser.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'comment',
          title: 'New Comment',
          message: `${currentUser.name} commented on your post`,
          actorId: currentUser.id,
          link: `/post/${id}`,
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}