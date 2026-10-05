import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: any = { userId: currentUser.id };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: currentUser.id, read: false } }),
    ]);

    return NextResponse.json({ notifications, total, unreadCount, limit, offset });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { notificationId, read } = body;

    if (notificationId) {
      // Mark single notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return NextResponse.json({ message: 'Notification updated' });
    } else if (read === true) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, read: false },
        data: { read: true },
      });

      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    return NextResponse.json(
      { error: 'notificationId or read=true required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notification:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}