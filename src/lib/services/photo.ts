import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Valid MIME types for photo uploads.
 */
const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ValidMimeType = (typeof VALID_MIME_TYPES)[number];

/**
 * Maximum file size: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Minimum dimensions: 200×200 pixels
 */
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;

/**
 * Storage bucket name for member photos.
 */
const STORAGE_BUCKET = "member-photos";

export interface PhotoValidationError {
  valid: false;
  error: string;
}

export interface PhotoValidationSuccess {
  valid: true;
}

export type PhotoValidationResult = PhotoValidationSuccess | PhotoValidationError;

export interface PhotoUploadResult {
  url: string;
  error?: undefined;
}

export interface PhotoUploadError {
  url?: undefined;
  error: string;
}

/**
 * Derives a file extension from a MIME type.
 * - image/jpeg → jpg
 * - image/png → png
 * - image/webp → webp
 */
export function getExtensionFromMime(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

/**
 * Builds the storage path for a member's photo.
 * Format: `member-photos/{member_id}.{extension}`
 */
export function buildStoragePath(memberId: string, extension: string): string {
  return `${memberId}.${extension}`;
}

/**
 * Validates a photo file for upload.
 * Checks:
 * - MIME type is one of image/jpeg, image/png, image/webp
 * - File size is greater than 0 bytes and at most 5MB
 * - Dimensions are at least 200×200 pixels
 *
 * @param file - An object representing the file with type, size, and dimensions
 */
export function validatePhoto(file: {
  type: string;
  size: number;
  width: number;
  height: number;
}): PhotoValidationResult {
  // Check MIME type
  if (!VALID_MIME_TYPES.includes(file.type as ValidMimeType)) {
    return {
      valid: false,
      error: "Please upload a JPEG, PNG, or WebP image.",
    };
  }

  // Check file size > 0
  if (file.size <= 0) {
    return {
      valid: false,
      error: "File is empty. Please select a valid image file.",
    };
  }

  // Check file size ≤ 5MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Photo must be under 5 MB. Please select a smaller file.",
    };
  }

  // Check minimum dimensions
  if (file.width < MIN_WIDTH || file.height < MIN_HEIGHT) {
    return {
      valid: false,
      error: "Photo must be at least 200×200 pixels.",
    };
  }

  return { valid: true };
}

/**
 * Uploads a member's photo to Supabase Storage.
 * Stores the file at `member-photos/{member_id}.{extension}`.
 * Returns the public URL of the uploaded photo.
 */
export async function uploadPhoto(
  memberId: string,
  file: File
): Promise<PhotoUploadResult | PhotoUploadError> {
  const supabase = createServiceRoleClient();

  const extension = getExtensionFromMime(file.type);
  if (!extension) {
    return { error: "Unsupported file type." };
  }

  const storagePath = buildStoragePath(memberId, extension);

  // Upload to Supabase Storage (upsert to replace existing photo)
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Update the profile's avatar_url
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", memberId);

  if (updateError) {
    return { error: `Failed to update profile: ${updateError.message}` };
  }

  return { url: publicUrl };
}

/**
 * Retrieves the stored photo URL for a member.
 * Returns the avatar_url from the member's profile.
 */
export async function getPhotoUrl(
  memberId: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", memberId)
    .single();

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data?.avatar_url ?? null };
}
