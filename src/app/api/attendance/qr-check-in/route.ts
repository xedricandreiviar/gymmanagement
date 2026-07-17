import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// UUID v4 format regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrContent } = body;

    // 1. Validate qrContent is a valid UUID
    if (!qrContent || typeof qrContent !== "string" || !UUID_REGEX.test(qrContent)) {
      return NextResponse.json(
        { error: "Unrecognized code. Please try again." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Look up profile by ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", qrContent)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Unrecognized code. Please try again." },
        { status: 404 }
      );
    }

    // 3. Look up active membership for the member
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("member_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No membership found for this member.", status: "none" },
        { status: 403 }
      );
    }

    // 4. Check membership status - reject if expired/frozen/cancelled
    if (
      membership.status === "expired" ||
      membership.status === "frozen" ||
      membership.status === "cancelled"
    ) {
      const statusMessages: Record<string, string> = {
        expired: "Membership expired. Please contact front desk.",
        frozen: "Membership frozen. Please contact admin.",
        cancelled: "Membership cancelled. Please contact admin.",
      };

      return NextResponse.json(
        {
          error: statusMessages[membership.status],
          status: membership.status,
        },
        { status: 403 }
      );
    }

    // 5. Check for existing check-in today (same calendar day, server timezone)
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    ).toISOString();

    const { data: existingCheckIn } = await supabase
      .from("attendance")
      .select("id, check_in_time, check_out_time")
      .eq("member_id", profile.id)
      .gte("check_in_time", todayStart)
      .lt("check_in_time", todayEnd)
      .is("check_out_time", null)
      .order("check_in_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    let action: "check_in" | "check_out";

    if (existingCheckIn) {
      // 6. Update existing record's check_out_time (this is a checkout)
      const { error: updateError } = await supabase
        .from("attendance")
        .update({ check_out_time: now.toISOString() })
        .eq("id", existingCheckIn.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to record check-out. Please try again." },
          { status: 500 }
        );
      }

      action = "check_out";
    } else {
      // 7. Create new attendance record
      const { error: insertError } = await supabase
        .from("attendance")
        .insert({
          member_id: profile.id,
          check_in_time: now.toISOString(),
        });

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to record check-in. Please try again." },
          { status: 500 }
        );
      }

      action = "check_in";
    }

    // 8. Return success with member info
    return NextResponse.json({
      success: true,
      memberName: profile.full_name,
      memberPhoto: profile.avatar_url,
      membershipStatus: membership.status,
      action,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
