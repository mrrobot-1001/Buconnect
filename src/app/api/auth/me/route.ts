import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get additional counts
    const [postsCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { authorId: user.id } }),
      prisma.connection.count({ where: { followingId: user.id } }),
      prisma.connection.count({ where: { followerId: user.id } }),
    ]);

    return NextResponse.json({
      ...user,
      _count: {
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}