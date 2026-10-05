import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();

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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: currentUser.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({ liked: false, message: 'Post unliked' });
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId: id,
          userId: currentUser.id,
        },
      });

      // Create notification for post author (if not self-like)
      if (post.authorId !== currentUser.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'like',
            title: 'New Like',
            message: `${currentUser.name} liked your post`,
            actorId: currentUser.id,
            link: `/post/${id}`,
          },
        });
      }

      return NextResponse.json({ liked: true, message: 'Post liked' }, { status: 201 });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}