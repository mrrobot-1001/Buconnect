import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully!',
      counts: {
        users: userCount,
        posts: postCount,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}