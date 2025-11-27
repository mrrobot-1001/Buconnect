import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

const supabase: any = supabaseAdmin;

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@dev.com';
const ADMIN_PASSWORD = 'admin123';

const ADMIN_USER = {
  id: 'admin-001',
  name: 'Admin User',
  email: ADMIN_EMAIL,
  role: 'ADMIN' as const,
  bio: 'Platform Administrator',
  profileImage: 'https://picsum.photos/seed/admin/200/200',
  course: null,
  batch: null,
  profession: 'Administrator',
  created_at: new Date('2024-01-01'),
};

// Mock users for development (with profile images)
const MOCK_USERS = [
  {
    id: '1',
    name: 'Alisha Sharma',
    email: 'alisha.s@example.com',
    password: 'password123',
    role: 'ALUMNI' as const,
    bio: 'Software Engineer at Google. Passionate about AI and machine learning. Class of 2018.',
    profileImage: 'https://picsum.photos/seed/user1/200/200',
    course: 'Computer Science',
    batch: 2018,
    profession: 'Software Engineer @ Google',
    created_at: new Date('2024-01-10T10:00:00Z'),
  },
  {
    id: '2',
    name: 'Rohan Verma',
    email: 'rohan@example.com',
    password: 'password123',
    role: 'STUDENT' as const,
    bio: 'Final year student, exploring opportunities in web development. Eager to connect with alumni!',
    profileImage: 'https://picsum.photos/seed/user2/200/200',
    course: 'Information Technology',
    batch: 2025,
    profession: null,
    created_at: new Date('2024-07-15T11:30:00Z'),
  },
  {
    id: '3',
    name: 'Dr. Priya Singh',
    email: 'priya.s@example.com',
    password: 'password123',
    role: 'ADMIN' as const,
    bio: 'Professor, Department of Computer Science. Helping students bridge the gap between academia and industry.',
    profileImage: 'https://picsum.photos/seed/user3/200/200',
    course: 'Computer Science',
    batch: null,
    profession: 'Professor',
    created_at: new Date('2024-01-01T09:00:00Z'),
  },
  {
    id: '4',
    name: 'Vikram Mehta',
    email: 'vikram.m@example.com',
    password: 'password123',
    role: 'ALUMNI' as const,
    bio: 'Product Manager at Microsoft. Always happy to chat about product, strategy, and career growth.',
    profileImage: 'https://picsum.photos/seed/user4/200/200',
    course: 'Business Administration',
    batch: 2016,
    profession: 'Product Manager @ Microsoft',
    created_at: new Date('2024-06-22T18:45:00Z'),
  },
  {
    id: '5',
    name: 'Sneha Reddy',
    email: 'sneha.r@example.com',
    password: 'password123',
    role: 'STUDENT' as const,
    bio: 'Aspiring data scientist. Looking for internships and projects in the data space.',
    profileImage: 'https://picsum.photos/seed/user5/200/200',
    course: 'Data Science',
    batch: 2026,
    profession: null,
    created_at: new Date('2024-07-28T12:10:00Z'),
  },
  {
    id: '6',
    name: 'Harsh Rana',
    email: 'harsh@example.com',
    password: 'password123',
    role: 'STUDENT' as const,
    bio: 'MCA student passionate about web development and building amazing applications.',
    profileImage: 'https://picsum.photos/seed/harsh/200/200',
    course: 'MCA',
    batch: 2027,
    profession: null,
    created_at: new Date('2024-07-28T12:10:00Z'),
  },
];

import { applyRateLimit, authLimiter } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, authLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login request received:', { email, passwordLength: password?.length });

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if credentials match admin account
    if (trimmedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('Admin login successful');
      return NextResponse.json({
        user: ADMIN_USER,
        message: 'Login successful',
      });
    }

    // Check mock users first (for development)
    const mockUser = MOCK_USERS.find(u => u.email === trimmedEmail);
    if (mockUser && mockUser.password === password) {
      console.log('Mock user login successful');
      const { password: _, ...userWithoutPassword } = mockUser;
      return NextResponse.json({
        user: userWithoutPassword,
        message: 'Login successful',
      });
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      console.error('Supabase Auth login error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 500 }
      );
    }

    // Fetch additional user details from public.users table (synced via trigger)
    const { data: userDetails } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Combine auth user and public user details
    const user = {
      ...userDetails,
      email: data.user.email,
    };

    return NextResponse.json({
      user,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
