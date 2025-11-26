import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Test with known credentials
    const testEmail = 'rohan@example.com';
    const testPassword = 'password123';

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (error || !user) {
      return NextResponse.json({
        error: 'User not found',
        email: testEmail,
      });
    }

    const isPasswordValid = await bcrypt.compare(testPassword, user.password);

    return NextResponse.json({
      success: true,
      email: testEmail,
      userFound: true,
      passwordValid: isPasswordValid,
      hashLength: user.password.length,
      hashPrefix: user.password.substring(0, 10),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
