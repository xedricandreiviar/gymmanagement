// Supabase Edge Function: send-invitation
// Deno runtime - sends invitation email to new gym members
// Receives POST with { email, full_name, token }
// Constructs invitation link and sends email (or logs for development)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";

interface InvitationPayload {
  email: string;
  full_name: string;
  token: string;
}

serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: InvitationPayload = await req.json();
    const { email, full_name, token } = payload;

    // Validate required fields
    if (!email || !full_name || !token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, full_name, token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Construct the invitation link
    const invitationLink = `${SITE_URL}/register/complete?token=${token}`;

    // Build the email content
    const emailSubject = "You're Invited to Join GymFlow!";
    const emailBody = `
Hello ${full_name},

You've been invited to join GymFlow! Click the link below to complete your registration:

${invitationLink}

This invitation link will expire in 72 hours. If you did not expect this invitation, you can safely ignore this email.

Welcome to the team!
— The GymFlow Team
    `.trim();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a1628; color: #ffffff; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1e3a5f; border-radius: 12px; padding: 40px; border: 1px solid #2563eb;">
    <h1 style="color: #38bdf8; margin-bottom: 24px; font-size: 24px;">⚡ Welcome to GymFlow!</h1>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
      Hello <strong style="color: #ffffff;">${full_name}</strong>,
    </p>
    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
      You've been invited to join GymFlow! Click the button below to complete your registration and set up your account.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${invitationLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
        Complete Registration
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
      This invitation link will expire in 72 hours. If you did not expect this invitation, you can safely ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #2563eb; margin: 24px 0;">
    <p style="color: #94a3b8; font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${invitationLink}" style="color: #38bdf8; word-break: break-all;">${invitationLink}</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    // Attempt to send email via Supabase's built-in email or configured SMTP
    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (RESEND_API_KEY) {
      // Send via Resend API if configured
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("EMAIL_FROM") || "GymFlow <noreply@gymflow.app>",
          to: [email],
          subject: emailSubject,
          html: emailHtml,
          text: emailBody,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error("Resend API error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to send invitation email" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const resendData = await resendResponse.json();
      console.log("Email sent successfully via Resend:", resendData.id);
    } else if (SMTP_HOST) {
      // Log that SMTP is configured but not implemented in edge function
      // In production, you'd integrate with an SMTP library or use Supabase's built-in hooks
      console.log("SMTP configured but not implemented in edge function. Email details:");
      console.log(`To: ${email}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Link: ${invitationLink}`);
    } else {
      // Development mode: log the email content
      console.log("=== INVITATION EMAIL (Development Mode) ===");
      console.log(`To: ${email}`);
      console.log(`Name: ${full_name}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Invitation Link: ${invitationLink}`);
      console.log(`Token: ${token}`);
      console.log("=== END EMAIL ===");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email processed",
        invitation_link: invitationLink,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error while sending invitation email" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
