import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated and has admin privileges
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    const adminRoles = ["super_admin", "factory_owner", "general_manager"];
    if (!adminRoles.includes(callerProfile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only admins can invite users." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, fullName, role, department } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { error: "Email, full name, and role are required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Generate a temporary password - user will reset via email
    const tempPassword =
      "Temp" +
      Math.random().toString(36).slice(2, 8) +
      Math.floor(Math.random() * 100);

    // Create the auth user with admin client
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Skip email verification for invited users
        user_metadata: { full_name: fullName },
      });

    if (authError) {
      // Handle duplicate email
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Create the profile record
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        company_id: callerProfile.company_id,
        full_name: fullName,
        email,
        role,
        department: department || null,
        is_active: true,
      });

    if (profileError) {
      // Clean up: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile: " + profileError.message },
        { status: 500 }
      );
    }

    // Send a password reset email so the invited user can set their own password
    // This uses the Supabase built-in email flow
    const { error: resetError } =
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${request.nextUrl.origin}/reset-password`,
      });

    if (resetError) {
      // Non-fatal: user is created but may need manual password reset
      console.warn("Failed to send invitation email:", resetError.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        fullName,
        role,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
