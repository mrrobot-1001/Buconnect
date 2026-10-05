import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

// Toggle whether the current user has saved this post.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireAuth();

    const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const key = { userId_postId: { userId: currentUser.id, postId: id } };
    const existing = await prisma.savedPost.findUnique({ where: key });
    if (existing) {
      await prisma.savedPost.delete({ where: key });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedPost.create({ data: { userId: currentUser.id, postId: id } });
    return NextResponse.json({ saved: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error toggling saved post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
