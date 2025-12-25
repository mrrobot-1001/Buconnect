import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, createSupabaseServerClient } from "@/lib/supabase/server";
import { applyRateLimit, authLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, authLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { email, password, name, role, course, batch, profession, bio } =
      body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    // Check if user already exists in our users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Get the base URL for the email redirect
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create user in Supabase Auth with email verification required
    // Using signUp instead of admin.createUser to send verification email
    const supabase = createSupabaseServerClient();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          name: name,
          role: role || "STUDENT",
        },
      },
    });

    if (signUpError || !authData.user) {
      console.error("Supabase Auth signup error:", signUpError);
      return NextResponse.json(
        { error: signUpError?.message || "Failed to create user" },
        { status: 500 },
      );
    }

    // Create user in our users table
    const { data: newUser, error: createError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id, // Use same ID as Supabase Auth
        email: email.toLowerCase(),
        password: "", // Not needed as Supabase Auth handles this
        name,
        role: role || "STUDENT",
        course: course || null,
        batch: batch || null,
        profession: profession || null,
        bio: bio || null,
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error("User creation error:", createError);
      // Rollback: Delete auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: false,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
