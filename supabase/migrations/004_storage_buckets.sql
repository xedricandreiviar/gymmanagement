-- Storage Buckets Configuration
-- Creates private storage buckets for member photos and QR codes
-- Defines RLS policies for controlled access
-- Requirements: 4.6 (photo storage), 5.2 (QR code storage)

-- Create storage buckets (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('member-photos', 'member-photos', false),
  ('member-qr-codes', 'member-qr-codes', false);

-- =============================================================================
-- Storage RLS Policies for member-photos bucket
-- =============================================================================

-- Members can read (SELECT) their own photo
-- The storage path convention is: {profile_id}.{extension} within the bucket
CREATE POLICY "Members can read own photo"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-photos'
    AND auth.uid() IS NOT NULL
    AND split_part(storage.filename(name), '.', 1) = (
      SELECT id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can read all member photos
CREATE POLICY "Admins can read all member photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-photos'
    AND public.get_user_role() = 'admin'
  );

-- Trainers can read all member photos (for visual identification)
CREATE POLICY "Trainers can read all member photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-photos'
    AND public.get_user_role() = 'trainer'
  );

-- Service role handles uploads (INSERT) - no user-facing upload policy needed
-- The registration API uses the service role client for initial photo upload
-- Members can update (overwrite) their own photo
CREATE POLICY "Members can update own photo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'member-photos'
    AND auth.uid() IS NOT NULL
    AND split_part(storage.filename(name), '.', 1) = (
      SELECT id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- Storage RLS Policies for member-qr-codes bucket
-- =============================================================================

-- Members can read (SELECT) their own QR code
CREATE POLICY "Members can read own QR code"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-qr-codes'
    AND auth.uid() IS NOT NULL
    AND split_part(storage.filename(name), '.', 1) = (
      SELECT id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can read all QR codes
CREATE POLICY "Admins can read all QR codes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-qr-codes'
    AND public.get_user_role() = 'admin'
  );

-- Trainers can read all QR codes (for attendance verification)
CREATE POLICY "Trainers can read all QR codes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'member-qr-codes'
    AND public.get_user_role() = 'trainer'
  );

-- Service role handles all QR code uploads (INSERT/UPDATE)
-- QR codes are generated server-side during registration using the service role client
-- No user-facing upload/update policies needed for QR codes
