"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface MembershipPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  duration_days: number;
}

interface FieldErrors {
  email?: string;
  full_name?: string;
  plan_id?: string;
}

export function InvitationForm() {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");

  useEffect(() => {
    async function loadPlans() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("membership_plans")
        .select("id, name, type, price, duration_days")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setPlans(data);
      }
      setPlansLoading(false);
    }
    loadPlans();
  }, []);

  function validateForm(email: string, fullName: string, planId: string): FieldErrors {
    const errors: FieldErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (email.length > 254) {
      errors.email = "Email must be 254 characters or less";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!fullName) {
      errors.full_name = "Full name is required";
    } else if (fullName.length > 100) {
      errors.full_name = "Full name must be 100 characters or less";
    }

    if (!planId) {
      errors.plan_id = "Please select a membership plan";
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSuccess(false);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const fullName = (form.get("full_name") as string).trim();
    const planId = form.get("plan_id") as string;

    // Client-side validation
    const errors = validateForm(email, fullName, planId);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, plan_id: planId }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setSuccess(true);
        setInvitedEmail(email);
        (e.target as HTMLFormElement).reset();
      } else if (response.status === 409) {
        setFieldErrors({ email: "A member with this email already exists" });
      } else if (response.status === 400) {
        // Field-specific validation errors from server
        if (data.field) {
          setFieldErrors({ [data.field]: data.error } as FieldErrors);
        } else {
          setGeneralError(data.error || "Invalid form data");
        }
      } else {
        setGeneralError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setGeneralError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Invitation Sent</h2>
          <p className="text-muted text-sm">
            An invitation email has been sent to <span className="font-medium text-foreground">{invitedEmail}</span>.
            They can complete their registration using the link in the email.
          </p>
          <Button
            onClick={() => {
              setSuccess(false);
              setInvitedEmail("");
            }}
          >
            Send Another Invitation
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-6">Create Member Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="member@example.com"
          maxLength={254}
          error={fieldErrors.email}
          required
        />

        <Input
          id="full_name"
          name="full_name"
          label="Full Name"
          placeholder="Juan Dela Cruz"
          maxLength={100}
          error={fieldErrors.full_name}
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="plan_id" className="block text-sm font-medium text-foreground">
            Membership Plan
          </label>
          {plansLoading ? (
            <div className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted">
              No active plans available. Please create a plan first.
            </div>
          ) : (
            <select
              id="plan_id"
              name="plan_id"
              required
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
                fieldErrors.plan_id ? "border-destructive focus:ring-destructive/50" : "border-border"
              }`}
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — ₱{plan.price.toLocaleString()} ({plan.duration_days} days)
                </option>
              ))}
            </select>
          )}
          {fieldErrors.plan_id && (
            <p className="text-xs text-destructive">{fieldErrors.plan_id}</p>
          )}
        </div>

        {generalError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {generalError}
          </p>
        )}

        <div className="pt-2">
          <Button type="submit" loading={loading} disabled={plansLoading || plans.length === 0}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Card>
  );
}
