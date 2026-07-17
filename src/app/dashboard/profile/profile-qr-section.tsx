"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeDisplay } from "@/components/ui/qr-code-display";

interface ProfileQRSectionProps {
  qrCodeUrl: string | null;
  memberName: string;
  profileId: string;
}

export function ProfileQRSection({ qrCodeUrl, memberName, profileId }: ProfileQRSectionProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setRefreshing(false);
    }
  }, [profileId, router]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">My QR Code</h2>
      <p className="text-sm text-muted">
        Use this QR code for quick check-in at the gym.
      </p>
      {refreshing ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-6">
          <div className="flex h-[200px] w-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted">Generating QR code...</p>
        </div>
      ) : (
        <QRCodeDisplay
          qrCodeUrl={qrCodeUrl}
          memberName={memberName}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
