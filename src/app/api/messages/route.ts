import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get messages for a conversation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const otherUserId = searchParams.get('otherUserId');
    const conversations = searchParams.get('conversations'); // Get list of conversations

    if (conversations === 'true' && userId) {
      // Get all connected users for this user
      const { data: connections, error: connectionError } = await supabase
        .from('connection_requests')
        .select(`
          *,
          follower:users!connection_requests_follower_id_fkey (id, name, profile_image),
          following:users!connection_requests_following_id_fkey (id, name, profile_image)
        `)
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
        .eq('status', 'ACCEPTED');

      if (connectionError) {
        console.error('Error fetching connections:', connectionError);
        // Don't return error, just continue without connections
      } else {
        console.log(`Found ${connections?.length || 0} connections for user ${userId}`);
        if (connections && connections.length > 0) {
          console.log('Sample connection:', JSON.stringify(connections[0], null, 2));
        }
      }

      // Get all messages for a user
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (id, name, profile_image),
          recipient:users!messages_recipient_id_fkey (id, name, profile_image)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
          { error: 'Failed to fetch conversations' },
          { status: 500 }
        );
      }

      // Group messages by conversation
      const conversationsMap = new Map();

      // First, add all connected users to the map
      connections?.forEach((conn: any) => {
        const otherUser = conn.follower_id === userId ? conn.following : conn.follower;
        if (otherUser && !conversationsMap.has(otherUser.id)) {
          conversationsMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: 'No messages yet',
            lastMessageAt: conn.created_at,
            unreadCount: 0,
          });
        }
      });

      // Then, update with actual message data
      messages?.forEach((msg: any) => {
        const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
        const otherUser = msg.sender_id === userId ? msg.recipient : msg.sender;

        if (!conversationsMap.has(otherId)) {
          // This user isn't in connections, but we have messages with them
          conversationsMap.set(otherId, {
            user: otherUser,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: msg.recipient_id === userId && !msg.read ? 1 : 0,
          });
        } else {
          // Update existing conversation with latest message
          const existing = conversationsMap.get(otherId);

          // Since messages are sorted by created_at DESC, the first message we encounter is the latest
          if (existing.lastMessage === 'No messages yet') {
            existing.lastMessage = msg.content;
            existing.lastMessageAt = msg.created_at;
          }

          // Count unread messages
          if (msg.recipient_id === userId && !msg.read) {
            existing.unreadCount++;
          }
        }
      });

      // Sort by last message time (most recent first)
      const sortedConversations = Array.from(conversationsMap.values()).sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return NextResponse.json(sortedConversations);
    }

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { error: 'userId and otherUserId are required' },
        { status: 400 }
      );
    }

    // Get messages between two users
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (id, name, profile_image),
        recipient:users!messages_recipient_id_fkey (id, name, profile_image)
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', otherUserId)
      .eq('read', false);

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('Error in messages GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: Request) {
  try {
    const { senderId, receiverId, content } = await request.json();

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'senderId, receiverId, and content are required' },
        { status: 400 }
      );
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: receiverId,
        content,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey (id, name, profile_image),
        recipient:users!messages_recipient_id_fkey (id, name, profile_image)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Create a notification for the recipient
    try {
      const senderName = message.sender?.name || 'Someone';
      const truncatedContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
      
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          type: 'new_message',
          title: 'New Message',
          message: `${senderName} sent you a message: "${truncatedContent}"`,
          link: `/messaging?user=${senderId}`,
          actor_id: senderId,
          read: false,
        });
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
      // Don't fail the message send if notification fails
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error in messages POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read
export async function PATCH(request: Request) {
  try {
    const { userId, otherUserId } = await request.json();

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { error: 'userId and otherUserId are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', otherUserId)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error in messages PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
