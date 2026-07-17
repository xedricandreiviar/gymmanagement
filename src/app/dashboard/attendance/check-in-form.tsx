"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Member {
  id: string;
  full_name: string;
}

export function CheckInForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState("");

  async function handleCheckIn() {
    if (!selectedMember) return;
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("attendance").insert({
      member_id: selectedMember,
      check_in_time: new Date().toISOString(),
    });

    if (error) {
      setError(error.message);
    } else {
      setSelectedMember("");
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <h3 className="font-semibold mb-4">Manual Check-In</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Select a member...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </select>
        <Button onClick={handleCheckIn} loading={loading} disabled={!selectedMember}>
          Check In
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </Card>
  );
}
