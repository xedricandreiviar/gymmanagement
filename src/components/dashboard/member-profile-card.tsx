import { GlowCard } from "@/components/ui/glow-card";
import { Badge } from "@/components/ui/badge";

type MembershipStatus = "active" | "expired" | "frozen" | "cancelled";

interface MemberProfileCardProps {
  fullName: string;
  avatarUrl: string | null;
  qrCodeUrl: string | null;
  membershipStatus: MembershipStatus;
  planName: string;
  className?: string;
}

const statusVariantMap: Record<MembershipStatus, "success" | "destructive" | "warning" | "secondary"> = {
  active: "success",
  expired: "destructive",
  frozen: "warning",
  cancelled: "secondary",
};

export function MemberProfileCard({
  fullName,
  avatarUrl,
  qrCodeUrl,
  membershipStatus,
  planName,
  className = "",
}: MemberProfileCardProps) {
  return (
    <GlowCard className={`flex items-center gap-4 ${className}`}>
      {/* Member photo or default avatar placeholder */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${fullName} profile photo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted" aria-label="Default avatar placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Member info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-card-foreground">{fullName}</p>
        <p className="mt-0.5 text-xs text-muted">{planName}</p>
        <div className="mt-1">
          <Badge variant={statusVariantMap[membershipStatus]}>
            {membershipStatus}
          </Badge>
        </div>
      </div>

      {/* QR code thumbnail or placeholder icon */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt={`${fullName} QR code`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted" aria-label="QR code placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zM14.625 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zM4.875 14.25a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm11.25 1.875a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm-1.5 3a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm.75 1.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5zm3 0a.75.75 0 000 1.5h.75a.75.75 0 000-1.5h-.75z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </GlowCard>
  );
}
