import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('otherUserId');
    const conversations = searchParams.get('conversations') === 'true';

    if (conversations) {
      // Get all conversations for the current user
      // Find all users who have exchanged messages with current user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.id },
            { recipientId: currentUser.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by conversation partner
      const conversationMap = new Map<string, {
        user: { id: string; name: string; profileImage: string | null };
        lastMessage: string;
        lastMessageAt: string;
        unreadCount: number;
      }>();

      for (const msg of messages) {
        const otherUser = msg.senderId === currentUser.id ? msg.recipient : msg.sender;
        const otherUserId = otherUser.id;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user: otherUser,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt.toISOString(),
            unreadCount: 0,
          });
        }

        // Count unread messages (received by current user and not read)
        if (msg.recipientId === currentUser.id && !msg.read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unreadCount += 1;
        }
      }

      const conversationsList = Array.from(conversationMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return NextResponse.json(conversationsList);
    }

    if (otherUserId) {
      // Get messages between current user and other user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.id, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: currentUser.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          recipientId: currentUser.id,
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json(messages);
    }

    return NextResponse.json({ error: 'otherUserId or conversations=true required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    const { recipientId } = body;
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!recipientId || typeof recipientId !== 'string' || !content) {
      return NextResponse.json(
        { error: 'recipientId and content are required' },
        { status: 400 }
      );
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: 'Message is too long (max 5000 characters)' }, { status: 400 });
    }
    if (recipientId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: currentUser.id,
        recipientId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `${currentUser.name} sent you a message`,
        actorId: currentUser.id,
        link: `/messaging?userId=${currentUser.id}`,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}