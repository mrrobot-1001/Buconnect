import { supabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET all users with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = supabaseAdmin.from("users").select("*", { count: "exact" });

    // Filter by role
    if (role && role !== "ALL") {
      query = query.eq("role", role);
    }

    // Search by name or email
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    const { data: users, count, error } = await query;

    if (error) throw error;

    // Fetch email verification status from Supabase Auth for each user
    const usersWithVerification = await Promise.all(
      (users || []).map(async (user) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
          return {
            ...user,
            email_verified: authUser?.user?.email_confirmed_at ? true : false,
            email_confirmed_at: authUser?.user?.email_confirmed_at || null,
          };
        } catch {
          return {
            ...user,
            email_verified: false,
            email_confirmed_at: null,
          };
        }
      })
    );

    return NextResponse.json({
      users: usersWithVerification,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// UPDATE user details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, bio, course, batch, profession, role } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (role !== undefined) updateData.role = role;

    // Handle role-specific fields
    if (role === "STUDENT") {
      if (course !== undefined) updateData.course = course;
      if (batch !== undefined) {
        const batchNumber = parseInt(batch);
        updateData.batch = isNaN(batchNumber) ? null : batchNumber;
      }
      updateData.profession = null; // Clear profession for students
    } else if (role === "ALUMNI" || role === "ADMIN") {
      if (profession !== undefined) updateData.profession = profession;
      updateData.course = null; // Clear course for alumni/admin
      updateData.batch = null; // Clear batch for alumni/admin
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // First, get the user's profile image URL
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("profile_image")
      .eq("id", userId)
      .single();

    // Don't fail if user not found in public table
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError);
    }

    // If a profile image exists, delete it from storage
    if (user?.profile_image) {
      try {
        const fileName = user.profile_image.split("/").pop();
        if (fileName) {
          await supabaseAdmin.storage
            .from("profile-pictures")
            .remove([fileName]);
        }
      } catch (storageError) {
        console.error("Error deleting profile image:", storageError);
      }
    }

    // Delete related data first (comments, likes, posts, connections)
    // This ensures clean deletion even if cascade isn't set up
    try {
      await supabaseAdmin.from("comments").delete().eq("author_id", userId);
      await supabaseAdmin.from("likes").delete().eq("user_id", userId);
      await supabaseAdmin.from("connections").delete().eq("follower_id", userId);
      await supabaseAdmin.from("connections").delete().eq("following_id", userId);
      // Delete posts (this should cascade to comments and likes on those posts)
      await supabaseAdmin.from("posts").delete().eq("author_id", userId);
    } catch (relatedError) {
      console.error("Error deleting related data:", relatedError);
    }

    // Delete from public users table first
    const { error: publicError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (publicError) {
      console.error("Error deleting from public users:", publicError);
    }

    // Delete the user from the authentication system
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError && authError.message !== "User not found") {
      console.error("Error deleting from auth:", authError);
      // Don't throw - user might already be deleted from auth
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}

// POST - Resend verification email (admin action)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (action === "resend-verification") {
      if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      // Get user email from our users table
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get the origin for the redirect URL
      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      // Use inviteUserByEmail which sends an email with a magic link
      // This works for existing users who haven't verified their email
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(user.email, {
        redirectTo: `${origin}/auth/callback`,
      });

      if (inviteError) {
        // If invite fails, try generating a link manually
        console.error("Invite error:", inviteError);
        
        // Alternative: Generate a signup link 
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "signup",
          email: user.email,
          options: {
            redirectTo: `${origin}/auth/callback`,
          },
        });

        if (linkError) {
          console.error("Error generating link:", linkError);
          return NextResponse.json(
            { error: "Failed to send verification email. User may already be verified." },
            { status: 500 }
          );
        }

        // The link is generated but not sent - you would need to send it via your own email service
        // For now, we'll return success since the user can still use "resend" from login page
        return NextResponse.json({ 
          message: "Verification link generated. User can also request a new link from the login page.",
          // Don't expose the actual link in production
        });
      }

      return NextResponse.json({ message: "Verification email sent successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
