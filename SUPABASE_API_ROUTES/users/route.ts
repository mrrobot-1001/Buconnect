import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/rate-limiter';
import { Cache, CacheKeys, CacheTTL } from '@/lib/cache';

// GET /api/users - Get all users with optional filtering
export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try cache first
    const cacheKey = CacheKeys.users(role || undefined, search || undefined);
    const cached = Cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, bio, profile_image, course, batch, profession, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,course.ilike.%${search}%,profession.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (user: any) => {
        const { count: postsCount } = await supabaseAdmin
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id);

        const { count: followersCount } = await supabaseAdmin
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        const { count: followingCount } = await supabaseAdmin
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);

        return {
          ...user,
          _count: {
            posts: postsCount || 0,
            followers: followersCount || 0,
            following: followingCount || 0,
          },
        };
      })
    );

    // Cache the results
    Cache.set(cacheKey, usersWithCounts, CacheTTL.users);

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
