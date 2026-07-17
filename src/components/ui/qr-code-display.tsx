"use client";

import { useCallback } from "react";
import { Button } from "./button";

interface QRCodeDisplayProps {
  qrCodeUrl: string | null;
  memberName?: string;
  onRefresh?: () => void;
}

export function QRCodeDisplay({ qrCodeUrl, memberName, onRefresh }: QRCodeDisplayProps) {
  const handleDownload = useCallback(async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = memberName
        ? `${memberName.replace(/\s+/g, "_").toLowerCase()}_qr_code.png`
        : "qr_code.png";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // If fetch fails (e.g. CORS), fall back to direct link download
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = memberName
        ? `${memberName.replace(/\s+/g, "_").toLowerCase()}_qr_code.png`
        : "qr_code.png";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [qrCodeUrl, memberName]);

  if (!qrCodeUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-6">
        <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md border border-border bg-secondary">
          <svg
            className="h-16 w-16 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 4.5h4.5v4.5h-4.5V4.5ZM15.75 4.5h4.5v4.5h-4.5V4.5ZM3.75 15.75h4.5v4.5h-4.5v-4.5ZM13.5 13.5h3v3h-3v-3ZM17.25 17.25h3v3h-3v-3Z"
            />
          </svg>
        </div>
        <p className="text-sm text-muted text-center">
          Your QR code is being generated...
        </p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
      <img
        src={qrCodeUrl}
        alt={memberName ? `QR code for ${memberName}` : "Member QR code"}
        className="h-[200px] w-[200px] min-h-[200px] min-w-[200px] rounded-md"
      />
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Download
      </Button>
    </div>
  );
}
