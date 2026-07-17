"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";
import { LightningBolt } from "@/components/ui/lightning-bolt";
import { Button } from "@/components/ui/button";

export default function RegisterSuccessPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Unable to load your profile. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("qr_code_url, full_name")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        setError("Unable to load your profile data.");
        setLoading(false);
        return;
      }

      setQrCodeUrl(profile.qr_code_url);
      setFullName(profile.full_name);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/login">
          <Button variant="primary" size="md">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center overflow-hidden">
      {/* Decorative LightningBolt elements */}
      <LightningBolt
        size="large"
        className="absolute -top-4 -right-4 text-accent-yellow"
      />
      <LightningBolt
        size="small"
        className="absolute -bottom-2 -left-2 text-accent"
      />

      {/* Success icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
        <svg
          className="h-8 w-8 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Completion message */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Registration Complete!
        </h1>
        <p className="text-sm text-secondary-foreground">
          Welcome to GymFlow{fullName ? `, ${fullName}` : ""}! Your account has been
          set up successfully.
        </p>
      </div>

      {/* QR Code display */}
      <div className="w-full">
        <p className="mb-3 text-sm font-medium text-foreground">
          Your Check-In QR Code
        </p>
        <QRCodeDisplay
          qrCodeUrl={qrCodeUrl}
          memberName={fullName}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Proceed to dashboard */}
      <Link href="/dashboard" className="w-full">
        <Button variant="primary" size="lg" className="w-full">
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
