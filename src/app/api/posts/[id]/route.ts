import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET single post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: post, error } = await supabase
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
        ),
        comments (
          *,
          author:users!comments_author_id_fkey (
            id,
            name,
            profile_image
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get counts
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    return NextResponse.json({
      ...post,
      _count: {
        likes: likesCount || 0,
        comments: commentsCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE post
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update post
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content, imageUrl } = await request.json();

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        author:users!posts_author_id_fkey (
          id,
          name,
          email,
          role,
          profile_image
        )
      `)
      .single();

    if (error || !post) {
      console.error('Error updating post:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Get counts
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    return NextResponse.json({
      ...post,
      _count: {
        likes: likesCount || 0,
        comments: commentsCount || 0,
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
