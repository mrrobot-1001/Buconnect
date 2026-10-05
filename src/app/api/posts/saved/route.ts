import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';
import { postInclude, withViewerState } from '@/lib/posts';

// The current user's saved posts, most recently saved first.
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const saved = await prisma.savedPost.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { post: { include: postInclude } },
    });

    const posts = await withViewerState(saved.map(s => s.post), currentUser.id);
    return NextResponse.json({ posts });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching saved posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
