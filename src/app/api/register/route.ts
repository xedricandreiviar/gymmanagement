import { NextRequest, NextResponse } from "next/server";
import {
  completeRegistration,
  validatePassword,
  validatePhone,
} from "@/lib/services/registration";

/**
 * POST /api/register
 * Handles member registration via invitation token.
 * Accepts multipart form data with: token, password, phone,
 * emergencyContactName, emergencyContactPhone, photo (file).
 *
 * This is a public endpoint — authorization is via a valid invitation token.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 5.1, 6.3, 6.4, 6.5, 6.6
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid request. Expected multipart form data." },
        { status: 400 }
      );
    }

    // Extract fields from form data
    const token = formData.get("token") as string | null;
    const password = formData.get("password") as string | null;
    const phone = formData.get("phone") as string | null;
    const emergencyContactName = formData.get("emergencyContactName") as string | null;
    const emergencyContactPhone = formData.get("emergencyContactPhone") as string | null;
    const photo = formData.get("photo") as File | null;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required.", field: "token" },
        { status: 401 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required.", field: "password" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required.", field: "phone" },
        { status: 400 }
      );
    }

    if (!emergencyContactName) {
      return NextResponse.json(
        { error: "Emergency contact name is required.", field: "emergencyContactName" },
        { status: 400 }
      );
    }

    if (!emergencyContactPhone) {
      return NextResponse.json(
        { error: "Emergency contact phone is required.", field: "emergencyContactPhone" },
        { status: 400 }
      );
    }

    // Validate password format before sending to service
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error, field: "password" },
        { status: 400 }
      );
    }

    // Validate phone format before sending to service
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error, field: "phone" },
        { status: 400 }
      );
    }

    // Orchestrate the full registration via service
    const result = await completeRegistration(
      token,
      password,
      phone,
      emergencyContactName,
      emergencyContactPhone,
      photo
    );

    if (!result.success) {
      // Determine appropriate status code based on error field
      let statusCode = 400;
      if (result.field === "token") {
        // Token invalid or expired => 401/403
        const errorLower = result.error.toLowerCase();
        if (errorLower.includes("expired") || errorLower.includes("used")) {
          statusCode = 403;
        } else {
          statusCode = 401;
        }
      }

      return NextResponse.json(
        { error: result.error, field: result.field },
        { status: statusCode }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        memberId: result.memberId,
        profileId: result.profileId,
        membershipId: result.membershipId,
        paymentId: result.paymentId,
        qrCodeUrl: result.qrCodeUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
