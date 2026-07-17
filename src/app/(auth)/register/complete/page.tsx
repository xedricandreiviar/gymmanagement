"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { RegistrationForm } from "./registration-form";

interface InvitationData {
  email: string;
  full_name: string;
  plan_id: string;
  expires_at: string;
}

export default function RegisterCompletePage() {
  return (
    <Suspense
      fallback={
        <Card>
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-muted">Verifying your invitation...</p>
          </div>
        </Card>
      }
    >
      <RegisterCompleteContent />
    </Suspense>
  );
}

function RegisterCompleteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setStatus("invalid");
        setErrorMessage(
          "No invitation token provided. Please use the link from your invitation email."
        );
        return;
      }

      try {
        const response = await fetch(
          `/api/invitations/validate?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (data.valid && data.invitation) {
          setInvitation(data.invitation);
          setStatus("valid");
        } else {
          setStatus("invalid");
          setErrorMessage(
            data.error ||
              "This invitation link is no longer valid. Please contact your gym administrator."
          );
        }
      } catch {
        setStatus("invalid");
        setErrorMessage(
          "Unable to verify your invitation. Please check your connection and try again."
        );
      }
    }

    validateToken();
  }, [token]);

  // Loading state
  if (status === "loading") {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-muted">Verifying your invitation...</p>
        </div>
      </Card>
    );
  }

  // Invalid/expired token state
  if (status === "invalid") {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Invalid Invitation</h1>
          <p className="text-sm text-muted max-w-sm">{errorMessage}</p>
        </div>
      </Card>
    );
  }

  // Valid token — show registration form
  return (
    <RegistrationForm
      token={token!}
      email={invitation!.email}
      fullName={invitation!.full_name}
    />
  );
}
