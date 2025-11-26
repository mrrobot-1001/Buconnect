import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET comments for a post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey (
          id,
          name,
          profile_image,
          role
        )
      `)
      .eq('post_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create comment
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { text, authorId } = await request.json();

    if (!text || !authorId) {
      return NextResponse.json(
        { error: 'Text and authorId are required' },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        text,
        author_id: authorId,
        post_id: params.id,
      })
      .select(`
        *,
        author:users!comments_author_id_fkey (
          id,
          name,
          profile_image,
          role
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
