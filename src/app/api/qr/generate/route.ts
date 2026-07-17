import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreQRCode } from "@/lib/services/qr";

/**
 * UUID v4 regex pattern for validating member IDs.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/qr/generate
 *
 * Generates (or regenerates) a QR code for a member.
 * Body: { memberId: string }
 *
 * Authorization: Admin or the member themselves.
 *
 * Success response: { success: true, qrCodeUrl: string }
 * Error response: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId } = body;

    // Validate memberId is provided and is a valid UUID
    if (!memberId || typeof memberId !== "string") {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(memberId)) {
      return NextResponse.json(
        { error: "memberId must be a valid UUID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authorization: get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the current user's profile to check role
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Authorization: must be admin or the member themselves
    const isAdmin = currentProfile.role === "admin";
    const isSelf = currentProfile.id === memberId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    // Verify the target member exists
    const { data: memberProfile, error: memberError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", memberId)
      .single();

    if (memberError || !memberProfile) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Generate and store the QR code
    const qrCodeUrl = await generateAndStoreQRCode(memberId);

    if (!qrCodeUrl) {
      return NextResponse.json(
        { error: "QR code generation failed after multiple attempts" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, qrCodeUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("QR code generation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
