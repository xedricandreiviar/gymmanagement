"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QRScanner } from "@/components/attendance/qr-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AttendanceState =
  | { type: "scanning" }
  | {
      type: "success";
      memberName: string;
      memberPhoto: string | null;
      membershipStatus: string;
      action: "check_in" | "check_out";
    }
  | { type: "error"; message: string; status?: string };

const CONFIRMATION_DURATION = 5000; // 5 seconds
const ERROR_DURATION = 3000; // 3 seconds

export function QRAttendance() {
  const [state, setState] = useState<AttendanceState>({ type: "scanning" });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const returnToScanning = useCallback(() => {
    setState({ type: "scanning" });
  }, []);

  const handleCheckInSuccess = useCallback(
    (data: {
      memberName: string;
      memberPhoto: string | null;
      membershipStatus: string;
      action: "check_in" | "check_out";
    }) => {
      setState({
        type: "success",
        memberName: data.memberName,
        memberPhoto: data.memberPhoto,
        membershipStatus: data.membershipStatus,
        action: data.action,
      });

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Auto-return to scanning after confirmation duration
      timerRef.current = setTimeout(returnToScanning, CONFIRMATION_DURATION);
    },
    [returnToScanning]
  );

  const handleCheckInError = useCallback(
    (error: string, status?: string) => {
      setState({ type: "error", message: error, status });

      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Auto-return to scanning after error duration
      timerRef.current = setTimeout(returnToScanning, ERROR_DURATION);
    },
    [returnToScanning]
  );

  if (state.type === "success") {
    return <SuccessScreen state={state} />;
  }

  if (state.type === "error") {
    return <ErrorScreen state={state} />;
  }

  return (
    <QRScanner
      onCheckInSuccess={handleCheckInSuccess}
      onCheckInError={handleCheckInError}
      scanning={true}
    />
  );
}

function SuccessScreen({
  state,
}: {
  state: Extract<AttendanceState, { type: "success" }>;
}) {
  const actionLabel = state.action === "check_in" ? "Checked In" : "Checked Out";

  return (
    <Card className="border-success/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-success">
          <CheckCircleIcon />
          {actionLabel} Successfully
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Member Photo */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-success/50 bg-secondary flex items-center justify-center">
            {state.memberPhoto ? (
              <img
                src={state.memberPhoto}
                alt={state.memberName}
                className="w-full h-full object-cover"
              />
            ) : (
              <DefaultAvatarIcon />
            )}
          </div>

          {/* Member Name */}
          <h2 className="text-xl font-bold text-foreground">{state.memberName}</h2>

          {/* Status Badge */}
          <Badge variant="success">{state.membershipStatus}</Badge>

          {/* Action indicator */}
          <p className="text-sm text-muted">
            {state.action === "check_in"
              ? "Welcome! Enjoy your workout."
              : "Goodbye! See you next time."}
          </p>

          {/* Auto-return notice */}
          <p className="text-xs text-muted animate-pulse">
            Returning to scanner...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorScreen({
  state,
}: {
  state: Extract<AttendanceState, { type: "error" }>;
}) {
  const isStatusWarning =
    state.status === "expired" ||
    state.status === "frozen" ||
    state.status === "cancelled";

  return (
    <Card className={isStatusWarning ? "border-warning/50" : "border-destructive/50"}>
      <CardHeader>
        <CardTitle
          className={`flex items-center gap-2 ${
            isStatusWarning ? "text-warning" : "text-destructive"
          }`}
        >
          {isStatusWarning ? <WarningIcon /> : <ErrorIcon />}
          {isStatusWarning ? "Membership Warning" : "Check-In Failed"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Status badge for membership issues */}
          {isStatusWarning && (
            <Badge variant="warning">
              {state.status!.charAt(0).toUpperCase() + state.status!.slice(1)}
            </Badge>
          )}

          {/* Error message */}
          <p className="text-sm text-foreground text-center">{state.message}</p>

          {/* Auto-return notice */}
          <p className="text-xs text-muted animate-pulse">
            Returning to scanner...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function DefaultAvatarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
