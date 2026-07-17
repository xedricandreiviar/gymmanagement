"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types/database";

interface RoleSelectProps {
  memberId: string;
  currentRole: UserRole;
}

export function RoleSelect({ memberId, currentRole }: RoleSelectProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [loading, setLoading] = useState(false);

  async function handleChange(newRole: UserRole) {
    if (newRole === role) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", memberId);

    if (!error) {
      setRole(newRole);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value as UserRole)}
      disabled={loading}
      className={`rounded-md border border-border bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${
        role === "admin"
          ? "text-primary"
          : role === "trainer"
          ? "text-success"
          : "text-muted"
      }`}
    >
      <option value="member">Member</option>
      <option value="trainer">Trainer</option>
      <option value="admin">Admin</option>
    </select>
  );
}
