"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { PlanType } from "@/lib/types/database";

export function PlanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.from("membership_plans").insert({
      name: form.get("name") as string,
      type: form.get("type") as PlanType,
      price: Number(form.get("price")),
      duration_days: Number(form.get("duration_days")),
      description: (form.get("description") as string) || null,
      is_active: true,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/memberships");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-6">Create Membership Plan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" name="name" label="Plan Name" placeholder="e.g. Monthly Premium" required />
        <div className="space-y-1.5">
          <label htmlFor="type" className="block text-sm font-medium">Type</label>
          <select
            id="type"
            name="type"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <Input id="price" name="price" label="Price (₱)" type="number" min="0" step="0.01" placeholder="500" required />
        <Input id="duration_days" name="duration_days" label="Duration (days)" type="number" min="1" placeholder="30" required />
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Optional description..."
          />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Plan</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
