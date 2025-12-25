import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET user's posts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: posts, error } = await supabase
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
      .eq('author_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Get counts for likes and comments
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post: any) => {
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

    return NextResponse.json(postsWithCounts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
