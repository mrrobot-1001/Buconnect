import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Test connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to query (will fail if tables don't exist, but connection will work)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      // Expected if tables don't exist
      return NextResponse.json({
        status: 'connected',
        message: 'Supabase connection works!',
        error: error.message,
        hint: 'Tables probably don\'t exist yet. Run the SQL schema in Supabase SQL Editor.',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Supabase connected and tables exist!',
      data
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }, { status: 500 });
  }
}
