import { NextRequest, NextResponse } from "next/server";
import { checkExpiredMemberships } from "@/lib/services/membership";

/**
 * API route for triggering membership expiry checks.
 * Can be called by:
 * - A Vercel cron job
 * - A Supabase scheduled function
 * - A manual admin trigger
 *
 * Authenticated via a secret token passed in the Authorization header.
 */

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is configured, reject all requests
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await checkExpiredMemberships();

  if (result.error) {
    return NextResponse.json(
      { error: "Failed to check expired memberships", details: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    updatedCount: result.updatedCount,
    message: `${result.updatedCount} membership(s) marked as expired.`,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await checkExpiredMemberships();

  if (result.error) {
    return NextResponse.json(
      { error: "Failed to check expired memberships", details: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    updatedCount: result.updatedCount,
    message: `${result.updatedCount} membership(s) marked as expired.`,
  });
}
