"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface BookSessionButtonProps {
  sessionId: string;
  memberId: string;
  isBooked: boolean;
  isFull: boolean;
}

export function BookSessionButton({ sessionId, memberId, isBooked, isFull }: BookSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleBook() {
    setLoading(true);
    const supabase = createClient();

    if (isBooked) {
      await supabase
        .from("session_bookings")
        .update({ status: "cancelled" })
        .eq("session_id", sessionId)
        .eq("member_id", memberId);
    } else {
      await supabase.from("session_bookings").insert({
        session_id: sessionId,
        member_id: memberId,
        status: "confirmed",
      });
    }

    router.refresh();
    setLoading(false);
  }

  if (isFull && !isBooked) {
    return <Button size="sm" disabled variant="secondary">Full</Button>;
  }

  return (
    <Button
      size="sm"
      variant={isBooked ? "destructive" : "primary"}
      onClick={handleBook}
      loading={loading}
    >
      {isBooked ? "Cancel" : "Book"}
    </Button>
  );
}
