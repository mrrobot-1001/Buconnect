import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get user's connections (followers/following)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'followers' or 'following'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (type === 'followers') {
      // Get users who follow this user
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          follower_id,
          follower:users!connections_follower_id_fkey (
            id,
            name,
            email,
            profile_image,
            role,
            course,
            batch,
            profession,
            bio
          )
        `)
        .eq('following_id', userId);

      if (error) {
        console.error('Error fetching followers:', error);
        return NextResponse.json(
          { error: 'Failed to fetch followers' },
          { status: 500 }
        );
      }

      return NextResponse.json(connections?.map(c => c.follower) || []);
    } else if (type === 'following') {
      // Get users this user follows
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          following_id,
          following:users!connections_following_id_fkey (
            id,
            name,
            email,
            profile_image,
            role,
            course,
            batch,
            profession,
            bio
          )
        `)
        .eq('follower_id', userId);

      if (error) {
        console.error('Error fetching following:', error);
        return NextResponse.json(
          { error: 'Failed to fetch following' },
          { status: 500 }
        );
      }

      return NextResponse.json(connections?.map(c => c.following) || []);
    } else {
      return NextResponse.json(
        { error: 'type must be "followers" or "following"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in connections GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a connection (follow a user)
export async function POST(request: Request) {
  try {
    const { followerId, followingId } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }

    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      );
    }

    // Create connection
    const { data: connection, error } = await supabase
      .from('connections')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connection:', error);
      return NextResponse.json(
        { error: 'Failed to create connection' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Connection created successfully', connection },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in connections POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a connection (unfollow a user)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let followerId = searchParams.get('followerId');
    let followingId = searchParams.get('followingId');

    // Support both query params and request body
    if (!followerId || !followingId) {
      try {
        const body = await request.json();
        followerId = body.followerId;
        followingId = body.followingId;
      } catch {
        // If no body, continue with query params
      }
    }

    if (!followerId || !followingId) {
      return NextResponse.json(
        { error: 'followerId and followingId are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error deleting connection:', error);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Connection removed successfully' }
    );
  } catch (error) {
    console.error('Error in connections DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
