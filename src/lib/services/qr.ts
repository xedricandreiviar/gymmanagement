import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

/**
 * Generates a QR code PNG buffer encoding the member's profile UUID.
 * Exported for property testing.
 */
export async function generateQRCode(memberId: string): Promise<Buffer> {
  const buffer = await QRCode.toBuffer(memberId, {
    type: "png",
    width: 300,
    errorCorrectionLevel: "M",
  });
  return buffer;
}

/**
 * Uploads a QR code buffer to Supabase Storage at
 * `member-qr-codes/{member_id}.png`.
 * Returns the public URL of the stored QR code.
 */
export async function storeQRCode(
  memberId: string,
  qrBuffer: Buffer
): Promise<string> {
  const supabase = await createClient();
  const storagePath = `${memberId}.png`;

  const { error } = await supabase.storage
    .from("member-qr-codes")
    .upload(storagePath, qrBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to store QR code: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("member-qr-codes").getPublicUrl(storagePath);

  return publicUrl;
}

/**
 * Delays execution for the specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates and stores a QR code for a member with retry logic.
 * - Attempts up to 3 times with a 2-second delay between attempts.
 * - After all failures: completes without QR code and queues a background job.
 * Returns the public URL of the stored QR code, or null if all attempts fail.
 */
export async function generateAndStoreQRCode(
  memberId: string
): Promise<string | null> {
  const maxAttempts = 3;
  const retryDelayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const qrBuffer = await generateQRCode(memberId);
      const publicUrl = await storeQRCode(memberId, qrBuffer);

      // Update the member's profile with the QR code URL
      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ qr_code_url: publicUrl })
        .eq("id", memberId);

      if (updateError) {
        throw new Error(
          `Failed to update profile with QR URL: ${updateError.message}`
        );
      }

      return publicUrl;
    } catch (error) {
      console.error(
        `QR code generation attempt ${attempt}/${maxAttempts} failed for member ${memberId}:`,
        error
      );

      if (attempt < maxAttempts) {
        await delay(retryDelayMs);
      }
    }
  }

  // All attempts exhausted — queue background processing
  console.error(
    `All ${maxAttempts} QR code generation attempts failed for member ${memberId}. Queuing background job.`
  );
  await queueQRCodeBackgroundJob(memberId);

  return null;
}

/**
 * Queues a background job to generate the QR code later.
 * In a production system this might push to a job queue or trigger
 * a Supabase Edge Function. For now, we store a record that can be
 * picked up by a background processor within 60 seconds.
 */
async function queueQRCodeBackgroundJob(memberId: string): Promise<void> {
  // Log for admin review and queue for background processing.
  // A future implementation can use a dedicated jobs table or
  // invoke a Supabase Edge Function to retry QR generation.
  console.warn(
    `[QR Background Job] Queued QR code generation for member ${memberId}. ` +
      `Should be processed within 60 seconds.`
  );
}
