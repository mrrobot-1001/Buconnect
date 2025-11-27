import { supabaseAdmin } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET all users with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    // Filter by role
    if (role && role !== 'ALL') {
      query = query.eq('role', role);
    }

    // Search by name or email
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      users,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// UPDATE user details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, bio, course, batch, profession, role } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (role !== undefined) updateData.role = role;

    // Handle role-specific fields
    if (role === 'STUDENT') {
      if (course !== undefined) updateData.course = course;
      if (batch !== undefined) {
        const batchNumber = parseInt(batch);
        updateData.batch = isNaN(batchNumber) ? null : batchNumber;
      }
      updateData.profession = null; // Clear profession for students
    } else if (role === 'ALUMNI' || role === 'ADMIN') {
      if (profession !== undefined) updateData.profession = profession;
      updateData.course = null; // Clear course for alumni/admin
      updateData.batch = null; // Clear batch for alumni/admin
    }


    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // First, get the user's profile image URL
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('profile_image')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // If a profile image exists, delete it from storage
    if (user?.profile_image) {
      try {
        const fileName = user.profile_image.split('/').pop();
        if (fileName) {
          await supabaseAdmin.storage
            .from('profile-pictures')
            .remove([fileName]);
        }
      } catch (storageError) {
        console.error('Error deleting profile image:', storageError);
        // Don't block user deletion if image deletion fails, just log it
      }
    }

    // Delete user (this will cascade delete posts, comments, likes via foreign keys)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
