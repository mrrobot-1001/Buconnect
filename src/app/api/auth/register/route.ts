import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

// Use the public anon key for sign-up to ensure verification email is sent
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: Request) {
  try {
    const { name, email, password, role, course, batch, profession } =
      await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name,
          role: role || "STUDENT",
          course,
          batch: batch ? parseInt(batch) : null,
          profession,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error("Supabase Auth error:", error);
      return NextResponse.json(
        { error: error.message || "Registration failed" },
        { status: 400 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 },
      );
    }

    // MANUAL SYNC: Ensure user exists in public.users
    // This allows registration to work even if the database trigger is disabled/broken
    const userRole = (role || "STUDENT") as "STUDENT" | "ALUMNI" | "ADMIN";
    const batchValue = batch ? parseInt(batch) : null;

    const { error: syncError } = await supabaseAdmin.from("users").upsert(
      {
        id: data.user.id,
        email: email.toLowerCase().trim(),
        name,
        role: userRole,
        password: "managed_by_supabase_auth",
        course,
        batch: batchValue,
        profession,
        created_at: new Date().toISOString(),
      } as any,
      { onConflict: "id" },
    );

    if (syncError) {
      console.error("Manual sync warning:", syncError);
      // We don't fail the request here, as the auth user was created successfully
    }

    return NextResponse.json(
      {
        user: data.user,
        message:
          "Registration successful. Please check your email to verify your account.",
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
