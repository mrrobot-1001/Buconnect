import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get the base URL for the email redirect
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // First check if user exists in our database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ message: "If an account exists with this email, a verification link will be sent." });
    }

    // Check if user is already verified
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById((user as any).id);
    
    if (authUser?.user?.email_confirmed_at) {
      return NextResponse.json({ 
        message: "Your email is already verified. You can log in now.",
      });
    }

    // Try to send invite email (this works for unverified users)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${origin}/auth/callback`,
    });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      
      // If invite fails, the user might need to sign up again or there's another issue
      // Still return success message for security (don't reveal internal errors)
      return NextResponse.json({ 
        message: "If an account exists with this email, a verification link will be sent.",
      });
    }

    return NextResponse.json({ message: "Verification email sent! Please check your inbox." });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
