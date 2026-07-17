import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resendInvitation } from "@/lib/services/invitation";

/**
 * Checks if the current user has the 'admin' role.
 * Returns the admin's profile ID if authorized, or null if not.
 */
async function getAdminProfileId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return profile.id;
}

/**
 * POST /api/invitations/[id]/resend
 * Resend an expired invitation — invalidates old token, generates new one with fresh 72h expiry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminProfileId = await getAdminProfileId();
    if (!adminProfileId) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Invitation ID is required." },
        { status: 400 }
      );
    }

    const result = await resendInvitation(id);

    if ("error" in result && result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    // Trigger invitation email via Supabase Edge Function
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey && result.invitation) {
        await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            email: result.invitation.email,
            full_name: result.invitation.full_name,
            token: result.invitation.token,
          }),
        });
      }
    } catch {
      // Email sending failure is non-blocking
      console.error("Failed to trigger invitation email edge function on resend");
    }

    return NextResponse.json(
      { invitation: result.invitation },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
