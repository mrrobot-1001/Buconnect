import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    // Lists include member emails, so logged-in users only
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || currentUser.id;
    const type = searchParams.get('type'); // 'followers' or 'following'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (type === 'followers') {
      const connections = await prisma.connection.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
              course: true,
              batch: true,
              profession: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Check if current user is following each follower
      const following = await prisma.connection.findMany({
        where: {
          followerId: currentUser.id,
          followingId: { in: connections.map(c => c.follower.id) },
        },
        select: { followingId: true },
      });
      const followingIds = new Set<string>(following.map(f => f.followingId));

      const users = connections.map(c => ({
        ...c.follower,
        isFollowing: followingIds.has(c.follower.id),
      }));

      return NextResponse.json(users);
    } else if (type === 'following') {
      const connections = await prisma.connection.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
              course: true,
              batch: true,
              profession: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Check if current user is following each following
      const following = await prisma.connection.findMany({
        where: {
          followerId: currentUser.id,
          followingId: { in: connections.map(c => c.following.id) },
        },
        select: { followingId: true },
      });
      const followingIds = new Set<string>(following.map(f => f.followingId));

      const users = connections.map(c => ({
        ...c.following,
        isFollowing: followingIds.has(c.following.id),
      }));

      return NextResponse.json(users);
    } else {
      // Return both counts
      const [followersCount, followingCount] = await Promise.all([
        prisma.connection.count({ where: { followingId: userId } }),
        prisma.connection.count({ where: { followerId: userId } }),
      ]);

      return NextResponse.json({ followersCount, followingCount });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Connections are created only by accepting a request and removed via
// DELETE /api/connections/requests (see src/lib/connections.ts).
