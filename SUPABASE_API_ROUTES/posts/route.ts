import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/rate-limiter';
import { Cache, CacheKeys, CacheTTL } from '@/lib/cache';

// GET /api/posts - Get all posts or filtered posts
export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try cache first
    const cacheKey = CacheKeys.posts(limit, authorId || undefined);
    const cached = Cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build query
    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey (
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    // Get likes and comments counts for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const { count: likesCount } = await supabaseAdmin
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentsCount } = await supabaseAdmin
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        return {
          ...post,
          _count: {
            likes: likesCount || 0,
            comments: commentsCount || 0,
          },
        };
      })
    );

    // Cache the results
    Cache.set(cacheKey, postsWithCounts, CacheTTL.posts);

    return NextResponse.json(postsWithCounts);
  } catch (error) {
    console.error('Posts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { title, content, imageUrl, authorId } = body;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: 'Title, content, and authorId are required' },
        { status: 400 }
      );
    }

    const { data: newPost, error } = await supabaseAdmin
      .from('posts')
      .insert({
        title,
        content,
        image_url: imageUrl || null,
        author_id: authorId,
      })
      .select(`
        *,
        author:users!posts_author_id_fkey (
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
      .single();

    if (error || !newPost) {
      console.error('Error creating post:', error);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    // Invalidate posts cache
    Cache.clear();

    return NextResponse.json(
      {
        ...newPost,
        _count: {
          likes: 0,
          comments: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Posts POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
