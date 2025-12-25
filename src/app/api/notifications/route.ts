import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to check if a date is within the last 24 hours
const isWithin24Hours = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours <= 24;
};

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // First, delete old post notifications (more than 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    // Delete old notifications for both lowercase and uppercase types
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .in('type', ['new_post', 'NEW_POST'])
      .lt('created_at', oneDayAgo.toISOString());

    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        actor:users!notifications_actor_id_fkey (
          id,
          name,
          profile_image,
          role
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter out post notifications older than 24 hours (double-check in case delete failed)
    const filteredData = (data || []).filter(notification => {
      const isPostNotification = notification.type === 'new_post' || notification.type === 'NEW_POST';
      if (isPostNotification) {
        return isWithin24Hours(notification.created_at);
      }
      return true; // Keep all other notification types
    });

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, link, actorId, metadata } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link: link || null,
        actor_id: actorId || null,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, userId, markAllAsRead } = body;

    if (markAllAsRead && userId) {
      // Mark all notifications as read for a user
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Notification IDs are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const notificationId = searchParams.get('notificationId');
  const userId = searchParams.get('userId');
  const deleteAll = searchParams.get('deleteAll') === 'true';

  try {
    if (deleteAll && userId) {
      // Delete all read notifications for a user
      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'All read notifications deleted' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
