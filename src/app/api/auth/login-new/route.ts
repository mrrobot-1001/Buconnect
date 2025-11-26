import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { applyRateLimit, authLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, authLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });

    if (signInError || !authData.user) {
      console.error('Supabase Auth signin error:', signInError);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        { 
          error: 'Please verify your email before logging in. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED'
        },
        { status: 403 }
      );
    }

    // Get user profile from our users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      console.error('User profile fetch error:', userError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get user stats
    const [
      { count: postsCount },
      { count: followersCount },
      { count: followingCount }
    ] = await Promise.all([
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
      supabaseAdmin.from('connections').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabaseAdmin.from('connections').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
    ]);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      ...userWithoutPassword,
      emailVerified: true,
      _count: {
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
