import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Size limits
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB max input
const MAX_UPLOAD_SIZE_BYTES = 1 * 1024 * 1024; // 1MB max for actual upload (should be compressed)

// POST - Upload profile picture
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (compressed images should be under 1MB)
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 1MB. Please compress your image.' },
        { status: 400 }
      );
    }

    // Create a unique filename (always save as jpg since we compress to JPEG)
    const fileName = `${userId}-${Date.now()}.jpg`;
    const filePath = `profile-pictures/${fileName}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      url: publicUrl,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
