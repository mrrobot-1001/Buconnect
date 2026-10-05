import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || currentUser?.id;
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
      let followingIds = new Set<string>();
      if (currentUser) {
        const following = await prisma.connection.findMany({
          where: {
            followerId: currentUser.id,
            followingId: { in: connections.map(c => c.follower.id) },
          },
          select: { followingId: true },
        });
        followingIds = new Set(following.map(f => f.followingId));
      }

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
      let followingIds = new Set<string>();
      if (currentUser) {
        const following = await prisma.connection.findMany({
          where: {
            followerId: currentUser.id,
            followingId: { in: connections.map(c => c.following.id) },
          },
          select: { followingId: true },
        });
        followingIds = new Set(following.map(f => f.followingId));
      }

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
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required' },
        { status: 400 }
      );
    }

    if (currentUser.id === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existing = await prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      );
    }

    // Create connection
    const connection = await prisma.connection.create({
      data: {
        followerId: currentUser.id,
        followingId,
      },
    });

    // Create notification for followed user
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUser.name} started following you`,
        actorId: currentUser.id,
        link: `/profile/${currentUser.id}`,
      },
    });

    return NextResponse.json(
      { message: 'Connection created successfully', connection },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating connection:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    let followingId = searchParams.get('followingId');

    // Support both query params and request body
    if (!followingId) {
      try {
        const body = await request.json();
        followingId = body.followingId;
      } catch {
        // If no body, continue with query params
      }
    }

    if (!followingId) {
      return NextResponse.json(
        { error: 'followingId is required' },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    await prisma.connection.delete({
      where: { id: connection.id },
    });

    return NextResponse.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}