"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { PaymentMethod, PaymentStatus } from "@/lib/types/database";

interface Member {
  id: string;
  full_name: string;
}

export function PaymentForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const status = form.get("status") as PaymentStatus;

    const { error } = await supabase.from("payments").insert({
      member_id: form.get("member_id") as string,
      amount: Number(form.get("amount")),
      method: form.get("method") as PaymentMethod,
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/payments");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-6">Record Payment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="member_id" className="block text-sm font-medium">Member</label>
          <select
            id="member_id"
            name="member_id"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select a member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        <Input id="amount" name="amount" label="Amount (₱)" type="number" min="0" step="0.01" placeholder="500" required />
        <div className="space-y-1.5">
          <label htmlFor="method" className="block text-sm font-medium">Payment Method</label>
          <select
            id="method"
            name="method"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="gcash">GCash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select
            id="status"
            name="status"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Record Payment</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
