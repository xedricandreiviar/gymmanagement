"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 200;

interface PhotoUploadProps {
  onPhotoSelect: (file: File | null) => void;
  error?: string;
}

export function PhotoUpload({ onPhotoSelect, error: externalError }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check camera availability on mount
  useEffect(() => {
    async function checkCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraAvailable(false);
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some((d) => d.kind === "videoinput");
        setCameraAvailable(hasCamera);
      } catch {
        setCameraAvailable(false);
      }
    }
    checkCamera();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const validateFile = useCallback(
    (file: File): Promise<string | null> => {
      return new Promise((resolve) => {
        // Check MIME type
        if (!VALID_MIME_TYPES.includes(file.type)) {
          resolve("Please upload a JPEG, PNG, or WebP image.");
          return;
        }

        // Check file size
        if (file.size <= 0) {
          resolve("File is empty. Please select a valid image file.");
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          resolve("Photo must be under 5 MB. Please select a smaller file.");
          return;
        }

        // Check dimensions
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
            resolve("Photo must be at least 200×200 pixels.");
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve("Unable to read image. Please select a valid image file.");
        };
        img.src = objectUrl;
      });
    },
    []
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      setValidationError(null);

      const error = await validateFile(file);
      if (error) {
        setValidationError(error);
        onPhotoSelect(null);
        return;
      }

      // Valid file — set preview and notify parent
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onPhotoSelect(file);
    },
    [validateFile, onPhotoSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    setValidationError(null);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraAvailable(false);
      setCameraError("Camera access was denied. Please use file upload instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
          stopCamera();
          handleFileSelected(file);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const removePhoto = () => {
    setPreview(null);
    setValidationError(null);
    onPhotoSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayError = validationError || externalError;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Photo <span className="text-destructive">*</span>
      </label>

      {/* Preview */}
      {preview && (
        <div className="flex flex-col items-center gap-2">
          <img
            src={preview}
            alt="Photo preview"
            className="rounded-md border border-border object-cover"
            style={{ minWidth: 150, minHeight: 150, maxWidth: 300, maxHeight: 300 }}
          />
          <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
            Remove photo
          </Button>
        </div>
      )}

      {/* Upload controls (hidden when previewing) */}
      {!preview && !cameraActive && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="md" onClick={openFilePicker}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Upload Photo
          </Button>

          {cameraAvailable && (
            <Button type="button" variant="outline" size="md" onClick={startCamera}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Take Photo
            </Button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload photo file"
      />

      {/* Camera view */}
      {cameraActive && (
        <div className="flex flex-col items-center gap-3">
          <video
            ref={videoRef}
            className="rounded-md border border-border"
            style={{ maxWidth: 320, maxHeight: 240 }}
            muted
            playsInline
          />
          <div className="flex gap-2">
            <Button type="button" variant="primary" size="md" onClick={capturePhoto}>
              Capture
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Camera fallback message */}
      {!cameraAvailable && cameraError && (
        <p className="text-xs text-muted">{cameraError}</p>
      )}

      {/* Validation error */}
      {displayError && (
        <p className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      )}

      {/* Help text */}
      {!preview && !displayError && (
        <p className="text-xs text-muted">
          Accepted formats: JPEG, PNG, WebP. Minimum 200×200px. Maximum 5 MB.
        </p>
      )}

      {/* Privacy disclaimer */}
      <p className="text-xs text-muted/70 italic">
        Your photo will only be used and displayed to gym staff to verify your identity when you check in at the gym. It will not be shared with third parties.
      </p>
    </div>
  );
}
