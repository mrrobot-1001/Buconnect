import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyRateLimit, authLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, authLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

    if (authError) {
      console.error("Supabase Auth login error:", authError);
      return NextResponse.json(
        { error: authError.message || "Invalid login credentials" },
        { status: 401 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Login failed: User not found" },
        { status: 401 },
      );
    }

    // Check if email is verified
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }, // 403 Forbidden
      );
    }

    // Fetch additional user details from the public 'users' table
    const { data: userDetails, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (dbError || !userDetails) {
      console.error("Error fetching user details:", dbError);
      // Even if we can't get profile, login can succeed.
      // The frontend can handle a missing profile.
      return NextResponse.json({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: authData.user.user_metadata.role || "STUDENT",
          // other fields might be null
        },
        message: "Login successful, but profile may be incomplete.",
      });
    }

    return NextResponse.json({
      user: userDetails,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
