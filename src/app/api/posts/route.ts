import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const supabase: any = supabaseAdmin;

// GET all posts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const limit = searchParams.get('limit');
    const hashtags = searchParams.get('hashtags'); // e.g. "job,internship"

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    if (hashtags) {
      const tags = hashtags.split(',').map(tag => tag.trim());
      if (tags.length > 0) {
        // Create OR filter for hashtags in both title and content
        // title.ilike.%#tag%,content.ilike.%#tag%
        const orConditions = tags.flatMap(tag => [
          `title.ilike.%#${tag}%`,
          `content.ilike.%#${tag}%`
        ]);
        query = query.or(orConditions.join(','));
      }
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Get counts for likes and comments
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentsCount } = await supabase
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

    const response = NextResponse.json(postsWithCounts);
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { applyRateLimit, postLimiter } from '@/lib/rate-limiter';

// POST create new post
export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, postLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { title, content, imageUrl, authorId } = await request.json();

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: 'Title, content, and authorId are required' },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        image_url: imageUrl,
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

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Get all followers to notify
    const { data: connections } = await supabase
      .from('connections')
      .select('follower_id')
      .eq('following_id', authorId);

    if (connections && connections.length > 0) {
      const notifications = connections.map(conn => ({
        user_id: conn.follower_id,
        type: 'NEW_POST',
        title: 'New Post',
        message: `${post.author.name} posted: ${title}`,
        actor_id: authorId,
        link: `/post/${post.id}`,
        read: false
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({
      ...post,
      _count: {
        likes: 0,
        comments: 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
