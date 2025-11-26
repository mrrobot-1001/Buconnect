import { NextRequest, NextResponse } from 'next/server';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@dev.com';
const ADMIN_PASSWORD = 'admin123';

// Admin user object
const ADMIN_USER = {
  id: 'admin-001',
  name: 'Admin User',
  email: ADMIN_EMAIL,
  role: 'ADMIN' as const,
  bio: 'Platform Administrator',
  profileImage: null,
  course: null,
  batch: null,
  profession: 'Administrator',
  created_at: new Date('2024-01-01'),
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if credentials match admin account
    if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          user: ADMIN_USER,
          message: 'Admin login successful',
        },
        { status: 200 }
      );
    }

    // If not admin, reject
    return NextResponse.json(
      { error: 'Invalid admin credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
