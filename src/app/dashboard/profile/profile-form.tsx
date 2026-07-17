"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.get("full_name") as string,
        phone: (form.get("phone") as string) || null,
        emergency_contact: (form.get("emergency_contact") as string) || null,
        health_notes: (form.get("health_notes") as string) || null,
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
          {profile.full_name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-semibold">{profile.full_name}</p>
          <Badge>{profile.role}</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="full_name"
          name="full_name"
          label="Full Name"
          defaultValue={profile.full_name}
          required
        />
        <Input
          id="phone"
          name="phone"
          label="Phone"
          defaultValue={profile.phone || ""}
          placeholder="+63 9XX XXX XXXX"
        />
        <Input
          id="emergency_contact"
          name="emergency_contact"
          label="Emergency Contact"
          defaultValue={profile.emergency_contact || ""}
          placeholder="Name & number"
        />
        <div className="space-y-1.5">
          <label htmlFor="health_notes" className="block text-sm font-medium">Health Notes</label>
          <textarea
            id="health_notes"
            name="health_notes"
            rows={3}
            defaultValue={profile.health_notes || ""}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Allergies, conditions, etc."
          />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success bg-success/10 rounded-md px-3 py-2">Profile updated!</p>
        )}
        <Button type="submit" loading={loading}>Save Changes</Button>
      </form>
    </Card>
  );
}
