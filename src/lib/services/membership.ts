import { createClient } from "@/lib/supabase/server";
import type { MembershipStatus } from "@/lib/types/database";

export interface CreateMembershipResult {
  membership: {
    id: string;
    member_id: string;
    plan_id: string;
    start_date: string;
    end_date: string;
    status: MembershipStatus;
    created_at: string;
  };
  error?: undefined;
}

export interface MembershipError {
  membership?: undefined;
  error: string;
}

export interface ExpiredMembershipsResult {
  updatedCount: number;
  error?: string;
}

/**
 * Pure helper function that calculates the end date by adding a specified
 * number of days to a start date.
 *
 * @param startDate - ISO date string (e.g. "2024-01-15")
 * @param durationDays - Number of days to add
 * @returns ISO date string representing the end date (YYYY-MM-DD)
 */
export function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + durationDays);
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, "0");
  const day = String(start.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Creates a new membership record for a member.
 * Looks up the plan to get duration_days, calculates end_date,
 * and inserts a membership record with status 'active'.
 *
 * @param memberId - The member's profile ID
 * @param planId - The membership plan ID
 * @param startDate - ISO date string for the membership start date
 */
export async function createMembership(
  memberId: string,
  planId: string,
  startDate: string
): Promise<CreateMembershipResult | MembershipError> {
  const supabase = await createClient();

  // Look up the plan to get duration_days
  const { data: plan, error: planError } = await supabase
    .from("membership_plans")
    .select("duration_days")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return { error: "Membership plan not found." };
  }

  const endDate = calculateEndDate(startDate, plan.duration_days);

  // Insert the membership record
  const { data, error } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      plan_id: planId,
      start_date: startDate,
      end_date: endDate,
      status: "active" as MembershipStatus,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { membership: data };
}

/**
 * Checks for active memberships that have passed their end_date
 * and updates their status to 'expired'.
 */
export async function checkExpiredMemberships(): Promise<ExpiredMembershipsResult> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("memberships")
    .update({ status: "expired" as MembershipStatus })
    .eq("status", "active")
    .lt("end_date", today)
    .select();

  if (error) {
    return { updatedCount: 0, error: error.message };
  }

  return { updatedCount: data?.length ?? 0 };
}
