import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, bio, profile_image, course, batch, profession, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get counts
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', id);

    const { count: followersCount } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id);

    const { count: followingCount } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);

    const response = NextResponse.json({
      ...user,
      _count: {
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
      },
    });
    
    // Add cache headers - revalidate every 30 seconds
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, bio, profileImage, course, batch, profession } = await request.json();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImage !== undefined) updateData.profile_image = profileImage;
    if (course !== undefined) updateData.course = course;
    if (batch !== undefined) updateData.batch = batch ? parseInt(batch) : null;
    if (profession !== undefined) updateData.profession = profession;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, bio, profile_image, course, batch, profession, created_at')
      .single();

    if (error || !user) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
