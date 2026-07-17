import { createClient } from "@/lib/supabase/server";
import { validateToken, markAsAccepted } from "@/lib/services/invitation";
import type { Invitation } from "@/lib/types/database";

export interface RegistrationResult {
  success: true;
  memberId: string;
  profileId: string;
  membershipId: string;
  paymentId: string;
  qrCodeUrl?: string;
}

export interface RegistrationError {
  success: false;
  error: string;
  field?: string;
}

/**
 * Validates a password against the registration requirements.
 * - Must be between 8 and 72 characters inclusive
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one numeric digit
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8 || password.length > 72) {
    return {
      valid: false,
      error: "Password must be between 8 and 72 characters.",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one number.",
    };
  }

  return { valid: true };
}

/**
 * Validates a phone number.
 * - Must contain between 7 and 15 digit characters inclusive.
 * - Non-digit characters are stripped before validation.
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      valid: false,
      error: "Phone number must contain between 7 and 15 digits.",
    };
  }

  return { valid: true };
}

/**
 * Orchestrates the full member registration flow:
 * 1. Validate invitation token
 * 2. Validate password and phone
 * 3. Create Supabase Auth user (email + password)
 * 4. Update profile (phone, emergency contact)
 * 5. Upload photo to member-photos/
 * 6. Generate QR code and store in member-qr-codes/
 * 7. Create membership record (start_date = now, end_date = start + plan.duration_days)
 * 8. Create pending payment record (amount = plan.price, status = "pending", method = "other")
 * 9. Mark invitation as accepted
 */
export async function completeRegistration(
  token: string,
  password: string,
  phone: string,
  emergencyContactName: string,
  emergencyContactPhone: string,
  photoFile: File | null
): Promise<RegistrationResult | RegistrationError> {
  // Step 1: Validate invitation token
  const tokenResult = await validateToken(token);
  if (!tokenResult.valid || !tokenResult.invitation) {
    return {
      success: false,
      error: tokenResult.error || "Invalid invitation token.",
      field: "token",
    };
  }

  const invitation: Invitation = tokenResult.invitation;

  // Step 2: Validate password
  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    return {
      success: false,
      error: passwordResult.error!,
      field: "password",
    };
  }

  // Step 3: Validate phone
  const phoneResult = validatePhone(phone);
  if (!phoneResult.valid) {
    return {
      success: false,
      error: phoneResult.error!,
      field: "phone",
    };
  }

  const supabase = await createClient();

  // Step 4: Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || "Failed to create user account.",
      field: "email",
    };
  }

  const userId = authData.user.id;

  // Step 5: Update profile with phone and emergency contact
  const emergencyContact = `${emergencyContactName} - ${emergencyContactPhone}`;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({
      phone,
      emergency_contact: emergencyContact,
    })
    .eq("user_id", userId)
    .select()
    .single();

  let profileId: string;

  if (profileError || !profileData) {
    // If profile doesn't exist yet (trigger may not have run), create it
    const { data: newProfile, error: createProfileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: invitation.full_name,
        phone,
        emergency_contact: emergencyContact,
        role: "member" as const,
      })
      .select()
      .single();

    if (createProfileError || !newProfile) {
      return {
        success: false,
        error: createProfileError?.message || "Failed to create profile.",
      };
    }

    profileId = newProfile.id;
  } else {
    profileId = profileData.id;
  }

  // Step 6: Upload photo (optional step - uses try/catch since photo service may not exist yet)
  let avatarUrl: string | undefined;
  if (photoFile) {
    try {
      const { uploadPhoto } = await import("@/lib/services/photo");
      const uploadResult = await uploadPhoto(profileId, photoFile);
      if (uploadResult && typeof uploadResult === "object" && "url" in uploadResult) {
        avatarUrl = uploadResult.url as string;
        await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", profileId);
      }
    } catch {
      // Photo service may not be available yet - continue without photo upload
    }
  }

  // Step 7: Generate QR code (optional step - uses try/catch since QR service may not exist yet)
  let qrCodeUrl: string | undefined;
  try {
    const { generateQRCode, storeQRCode } = await import("@/lib/services/qr");
    const qrBuffer = await generateQRCode(profileId);
    if (qrBuffer) {
      const publicUrl = await storeQRCode(profileId, qrBuffer);
      if (publicUrl) {
        qrCodeUrl = publicUrl;
        await supabase
          .from("profiles")
          .update({ qr_code_url: qrCodeUrl })
          .eq("id", profileId);
      }
    }
  } catch {
    // QR service may not be available yet - continue without QR generation
  }

  // Step 8: Get the membership plan details
  const { data: plan, error: planError } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("id", invitation.plan_id)
    .single();

  if (planError || !plan) {
    return {
      success: false,
      error: "Failed to retrieve membership plan details.",
    };
  }

  // Step 9: Create membership record
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.duration_days);

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: profileId,
      plan_id: plan.id,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
    })
    .select()
    .single();

  if (membershipError || !membership) {
    return {
      success: false,
      error: membershipError?.message || "Failed to create membership.",
    };
  }

  // Step 10: Create pending payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      member_id: profileId,
      membership_id: membership.id,
      amount: plan.price,
      method: "other",
      status: "pending",
    })
    .select()
    .single();

  if (paymentError || !payment) {
    return {
      success: false,
      error: paymentError?.message || "Failed to create payment record.",
    };
  }

  // Step 11: Mark invitation as accepted
  const acceptResult = await markAsAccepted(token);
  if (!acceptResult.success) {
    // Non-critical failure - registration is still complete
    console.warn("Failed to mark invitation as accepted:", acceptResult.error);
  }

  return {
    success: true,
    memberId: userId,
    profileId,
    membershipId: membership.id,
    paymentId: payment.id,
    qrCodeUrl,
  };
}
