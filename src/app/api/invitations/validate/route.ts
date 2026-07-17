import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/services/invitation";

/**
 * GET /api/invitations/validate?token=xxx
 * Validates an invitation token for the registration page.
 * This is a public endpoint (no admin auth required) since
 * invited members use it to verify their invitation link.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required.", valid: false },
        { status: 400 }
      );
    }

    const result = await validateToken(token);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error || "This invitation link is no longer valid. Please contact your gym administrator.",
        },
        { status: 200 }
      );
    }

    // Return invitation details (excluding sensitive token field)
    const invitation = result.invitation!;
    return NextResponse.json(
      {
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          full_name: invitation.full_name,
          plan_id: invitation.plan_id,
          expires_at: invitation.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred.", valid: false },
      { status: 500 }
    );
  }
}
