import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { listInvitations } from "@/lib/services/invitation";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse pagination params
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

  const result = await listInvitations(page, pageSize);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse body
  let body: { email?: string; full_name?: string; plan_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, full_name, plan_id } = body;

  // Validate email
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required", field: "email" }, { status: 400 });
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail.length > 254) {
    return NextResponse.json({ error: "Email must be 254 characters or less", field: "email" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address", field: "email" }, { status: 400 });
  }

  // Validate full_name
  if (!full_name || typeof full_name !== "string") {
    return NextResponse.json({ error: "Full name is required", field: "full_name" }, { status: 400 });
  }
  const trimmedName = full_name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return NextResponse.json({ error: "Full name must be between 1 and 100 characters", field: "full_name" }, { status: 400 });
  }

  // Validate plan_id
  if (!plan_id || typeof plan_id !== "string") {
    return NextResponse.json({ error: "Please select a membership plan", field: "plan_id" }, { status: 400 });
  }

  // Verify plan exists and is active
  const { data: plan } = await supabase
    .from("membership_plans")
    .select("id")
    .eq("id", plan_id)
    .eq("is_active", true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Selected plan is not available", field: "plan_id" }, { status: 400 });
  }

  // Check if there's already a pending invitation for this email
  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("email", trimmedEmail)
    .eq("status", "sent")
    .single();

  if (existingInvitation) {
    return NextResponse.json(
      { error: "A pending invitation already exists for this email", field: "email" },
      { status: 409 }
    );
  }

  // Check if there's already an accepted invitation (registered member)
  const { data: acceptedInvitation } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", trimmedEmail)
    .eq("status", "accepted")
    .single();

  if (acceptedInvitation) {
    return NextResponse.json(
      { error: "A member with this email already exists", field: "email" },
      { status: 409 }
    );
  }

  // Generate unique token
  const token = randomBytes(32).toString("hex");

  // Set expiry to 72 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 72);

  // Create invitation record
  const { error: insertError } = await supabase
    .from("invitations")
    .insert({
      email: trimmedEmail,
      full_name: trimmedName,
      plan_id,
      token,
      status: "sent",
      invited_by: profile.id,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create invitation. Please try again." },
      { status: 500 }
    );
  }

  // Trigger send-invitation edge function to email the invitation link
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          full_name: trimmedName,
          token,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.error("Failed to send invitation email:", errorData);
        // Don't fail the entire request - invitation is already created
      }
    } catch (fetchError) {
      console.error("Error reaching send-invitation edge function:", fetchError);
      // Don't fail the entire request - invitation is already created
    }
  } else {
    console.log(
      `[DEV] Invitation created for ${trimmedEmail}. Edge function not triggered (missing SUPABASE_SERVICE_ROLE_KEY).`
    );
  }

  return NextResponse.json(
    { message: "Invitation created successfully", email: trimmedEmail },
    { status: 201 }
  );
}
