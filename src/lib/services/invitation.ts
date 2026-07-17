import { createClient } from "@/lib/supabase/server";
import type { Invitation, InvitationStatus } from "@/lib/types/database";

export interface CreateInvitationResult {
  invitation: Invitation;
  error?: undefined;
}

export interface InvitationError {
  invitation?: undefined;
  error: string;
  field?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  invitation?: Invitation;
  error?: string;
}

export interface PaginatedInvitations {
  data: Invitation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generates a unique, URL-safe token for invitation links.
 */
function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * Calculates the expiry timestamp 72 hours from now.
 */
function calculateExpiry(): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 72);
  return expiry.toISOString();
}

/**
 * Creates a new invitation for a member.
 * Generates a unique token with 72h expiry and inserts it into the database.
 */
export async function createInvitation(
  email: string,
  fullName: string,
  planId: string,
  invitedBy: string
): Promise<CreateInvitationResult | InvitationError> {
  const supabase = await createClient();

  const token = generateToken();
  const expiresAt = calculateExpiry();

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email,
      full_name: fullName,
      plan_id: planId,
      token,
      status: "sent" as InvitationStatus,
      invited_by: invitedBy,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { invitation: data as Invitation };
}

/**
 * Validates an invitation token.
 * Checks existence, expiry, and whether it has already been used.
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) {
    return { valid: false, error: "Invitation not found or invalid." };
  }

  const invitation = data as Invitation;

  // Check if already accepted
  if (invitation.status === "accepted") {
    return { valid: false, error: "This invitation has already been used." };
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(invitation.expires_at);
  if (now > expiresAt) {
    return { valid: false, error: "This invitation has expired. Please contact your gym administrator." };
  }

  return { valid: true, invitation };
}

/**
 * Returns a paginated list of invitations.
 * Max page size is capped at 50.
 */
export async function listInvitations(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedInvitations> {
  const supabase = await createClient();

  // Cap page size at 50
  const effectivePageSize = Math.min(Math.max(1, pageSize), 50);
  const effectivePage = Math.max(1, page);
  const offset = (effectivePage - 1) * effectivePageSize;

  // Get total count
  const { count } = await supabase
    .from("invitations")
    .select("*", { count: "exact", head: true });

  const total = count ?? 0;

  // Get paginated data
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + effectivePageSize - 1);

  if (error) {
    return {
      data: [],
      total: 0,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages: 0,
    };
  }

  return {
    data: (data as Invitation[]) ?? [],
    total,
    page: effectivePage,
    pageSize: effectivePageSize,
    totalPages: Math.ceil(total / effectivePageSize),
  };
}

/**
 * Resends an invitation by invalidating the old token and generating a new one with a fresh 72h expiry.
 */
export async function resendInvitation(
  id: string
): Promise<CreateInvitationResult | InvitationError> {
  const supabase = await createClient();

  // Fetch the existing invitation
  const { data: existing, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { error: "Invitation not found." };
  }

  // Generate a new token and expiry
  const newToken = generateToken();
  const newExpiry = calculateExpiry();

  // Update the invitation with the new token and fresh expiry
  const { data, error } = await supabase
    .from("invitations")
    .update({
      token: newToken,
      expires_at: newExpiry,
      status: "sent" as InvitationStatus,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { invitation: data as Invitation };
}

/**
 * Marks an invitation as accepted by updating its status and setting the accepted_at timestamp.
 */
export async function markAsAccepted(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .update({
      status: "accepted" as InvitationStatus,
      accepted_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
