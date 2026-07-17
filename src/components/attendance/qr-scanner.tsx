"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckInSuccessData {
  memberName: string;
  memberPhoto: string | null;
  membershipStatus: string;
  action: "check_in" | "check_out";
}

interface QRScannerProps {
  onCheckInSuccess: (data: CheckInSuccessData) => void;
  onCheckInError: (error: string, status?: string) => void;
  scanning?: boolean;
}

export function QRScanner({
  onCheckInSuccess,
  onCheckInError,
  scanning = true,
}: QRScannerProps) {
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const handleDecode = useCallback(
    async (decodedText: string) => {
      if (isProcessing || !mountedRef.current) return;
      setIsProcessing(true);

      try {
        const response = await fetch("/api/attendance/qr-check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrContent: decodedText }),
        });

        const data = await response.json();

        if (!mountedRef.current) return;

        if (response.ok && data.success) {
          onCheckInSuccess({
            memberName: data.memberName,
            memberPhoto: data.memberPhoto,
            membershipStatus: data.membershipStatus,
            action: data.action,
          });
        } else {
          onCheckInError(data.error || "Check-in failed.", data.status);
        }
      } catch {
        if (mountedRef.current) {
          onCheckInError("Connection error. Please try again.");
        }
      } finally {
        if (mountedRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [isProcessing, onCheckInSuccess, onCheckInError]
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check camera availability
  useEffect(() => {
    async function checkCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraAvailable(false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setCameraAvailable(true);
      } catch {
        setCameraAvailable(false);
      }
    }

    checkCamera();
  }, []);

  // Initialize / teardown scanner
  useEffect(() => {
    if (cameraAvailable !== true || !scanning) return;

    let html5Qrcode: any = null;
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (stopped) return;

        const scannerId = "qr-scanner-region";

        // Ensure the container element exists
        if (!document.getElementById(scannerId)) return;

        html5Qrcode = new Html5Qrcode(scannerId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            handleDecode(decodedText);
          },
          () => {
            // QR code scan error (no code found) — ignored silently
          }
        );
      } catch {
        if (!stopped && mountedRef.current) {
          setCameraAvailable(false);
        }
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (html5Qrcode) {
        html5Qrcode
          .stop()
          .then(() => {
            html5Qrcode.clear();
          })
          .catch(() => {
            // Ignore cleanup errors
          });
        scannerRef.current = null;
      }
    };
  }, [cameraAvailable, scanning, handleDecode]);

  // Camera not available — show fallback
  if (cameraAvailable === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraOffIcon />
            QR Scanner Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Camera is not available or permission was denied. Please use the
            manual check-in option below.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state while checking camera
  if (cameraAvailable === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanIcon />
            QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-muted">
              Checking camera access...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scanner active
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanIcon />
          QR Scanner
          {isProcessing && (
            <span className="ml-2 text-xs font-normal text-accent animate-pulse">
              Processing...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative w-full max-w-md mx-auto overflow-hidden rounded-lg border border-border"
        >
          <div id="qr-scanner-region" className="w-full" />
          {!scanning && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <p className="text-sm text-muted">Scanner paused</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted text-center mt-3">
          Point the camera at a member&apos;s QR code to check in
        </p>
      </CardContent>
    </Card>
  );
}

function ScanIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted"
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16" />
      <path d="M9.5 4h5L16 7h4a2 2 0 0 1 2 2v7.5" />
      <path d="M14.121 15.121A3 3 0 1 1 9.88 10.88" />
    </svg>
  );
}
