"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Trainer {
  id: string;
  full_name: string;
}

export function SessionForm({ trainers }: { trainers: Trainer[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.from("sessions").insert({
      title: form.get("title") as string,
      trainer_id: (form.get("trainer_id") as string) || null,
      date: form.get("date") as string,
      start_time: form.get("start_time") as string,
      end_time: form.get("end_time") as string,
      capacity: Number(form.get("capacity")),
      description: (form.get("description") as string) || null,
      recurring: form.get("recurring") === "on",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/sessions");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-6">Schedule New Session</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="title" name="title" label="Session Title" placeholder="e.g. Morning HIIT" required />
        <div className="space-y-1.5">
          <label htmlFor="trainer_id" className="block text-sm font-medium">Trainer</label>
          <select
            id="trainer_id"
            name="trainer_id"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Unassigned</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
        <Input id="date" name="date" label="Date" type="date" required />
        <div className="grid grid-cols-2 gap-4">
          <Input id="start_time" name="start_time" label="Start Time" type="time" required />
          <Input id="end_time" name="end_time" label="End Time" type="time" required />
        </div>
        <Input id="capacity" name="capacity" label="Capacity" type="number" min="1" placeholder="20" required />
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="recurring" className="rounded" />
          Recurring weekly
        </label>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Session</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
