import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  try {
    if (!userId) {
      // Return empty if no userId - this is for unauthenticated requests
      return NextResponse.json({ incoming: [], outgoing: [] });
    }

    // Get all requests sent TO this user (PENDING for acceptance, ACCEPTED for showing connections)
    const { data: incomingRequests, error: incomingError } = await supabaseAdmin
      .from('connection_requests')
      .select(`
        *,
        follower:users!connection_requests_follower_id_fkey (
          id,
          name,
          email,
          role,
          profile_image,
          course,
          batch,
          profession
        )
      `)
      .eq('following_id', userId)
      .in('status', ['PENDING', 'ACCEPTED']);

    if (incomingError) throw incomingError;

    // Get all requests sent BY this user (PENDING for tracking, ACCEPTED for showing connections)
    const { data: outgoingRequests, error: outgoingError } = await supabaseAdmin
      .from('connection_requests')
      .select(`
        *,
        following:users!connection_requests_following_id_fkey (
          id,
          name,
          email,
          role,
          profile_image,
          course,
          batch,
          profession
        )
      `)
      .eq('follower_id', userId)
      .in('status', ['PENDING', 'ACCEPTED']);

    if (outgoingError) throw outgoingError;

    return NextResponse.json({
      incoming: incomingRequests || [],
      outgoing: outgoingRequests || []
    });
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return NextResponse.json({ error: 'Failed to fetch connection requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sender_id, recipient_id } = body;

    if (!sender_id || !recipient_id) {
      return NextResponse.json({ error: 'Sender ID and Recipient ID are required' }, { status: 400 });
    }

    // Check if request already exists
    const { data: existing } = await supabaseAdmin
      .from('connection_requests')
      .select('*')
      .eq('follower_id', sender_id)
      .eq('following_id', recipient_id)
      .single();

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
      }
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Already connected' }, { status: 409 });
      }
    }

    // Create connection request
    const { data, error } = await supabaseAdmin
      .from('connection_requests')
      .insert({
        follower_id: sender_id,
        following_id: recipient_id,
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for recipient
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: recipient_id,
        type: 'CONNECTION_REQUEST',
        message: `You have a new connection request from user ${sender_id}`,
        sender_id: sender_id,
        is_read: false
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating connection request:', error);
    return NextResponse.json({ error: 'Failed to create connection request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status }: { requestId: string; status: string } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update request status
    const { data: requestData, error: updateError } = await supabaseAdmin
      .from('connection_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If accepted, create the connection
    if (status === 'ACCEPTED' && requestData) {
      const { error: connectionError } = await supabaseAdmin
        .from('connections')
        .insert({
          follower_id: requestData.follower_id,
          following_id: requestData.following_id
        });

      if (connectionError && connectionError.code !== '23505') { // Ignore duplicate errors
        throw connectionError;
      }

      // Create notification for the requester (follower)
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: requestData.follower_id,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Accepted',
          message: `Your connection request was accepted`,
          actor_id: requestData.following_id,
          link: `/profile/${requestData.following_id}`,
          read: false
        });
    }

    return NextResponse.json(requestData);
  } catch (error) {
    console.error('Error updating connection request:', error);
    return NextResponse.json({ error: 'Failed to update connection request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient_id, sender_id } = body;

    if (!recipient_id || !sender_id) {
      return NextResponse.json({ error: 'Recipient ID and Sender ID are required' }, { status: 400 });
    }

    // Delete the request (works in both directions)
    // Try to delete as sender first
    let { error } = await supabaseAdmin
      .from('connection_requests')
      .delete()
      .eq('follower_id', sender_id)
      .eq('following_id', recipient_id);

    // If not found as sender, try as recipient
    if (error && error.code === 'PGRST116') { // No rows affected
      const { error: error2 } = await supabaseAdmin
        .from('connection_requests')
        .delete()
        .eq('follower_id', recipient_id)
        .eq('following_id', sender_id);

      if (error2 && error2.code !== 'PGRST116') {
        throw error2;
      }
    } else if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection request:', error);
    return NextResponse.json({ error: 'Failed to delete connection request' }, { status: 500 });
  }
}
