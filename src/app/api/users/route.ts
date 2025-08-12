import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import * as UserService from "@/services/users.service";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    let users;
    if (search) {
      users = await UserService.searchUsers(organizationId, search);
    } else if (role) {
      users = await UserService.getUsersByRole(organizationId, role);
    } else if (status) {
      users = await UserService.getUsersByStatus(organizationId, status);
    } else {
      users = await UserService.getAllUsers(organizationId);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, first_name, last_name, phone, avatar_url, organization_id, role, status } = body;

    if (!email || !organization_id) {
      return NextResponse.json({ error: "Email and organization_id are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const newUser = await UserService.createUser({
      email,
      first_name,
      last_name,
      phone,
      avatar_url,
      organization_id,
      role: role || "viewer",
      status: status || "active"
    }, user.id);

    if (!newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Log activity
    await UserService.logUserActivity(user.id, "user_created", "user", newUser.id, { email });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
