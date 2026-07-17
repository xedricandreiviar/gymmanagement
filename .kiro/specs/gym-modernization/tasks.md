# Implementation Plan: GymFlow Modernization

## Overview

This plan implements the GymFlow modernization in incremental stages: theme foundation, database schema extensions, service layer, API routes, UI components, and integration wiring. Each task builds on previous work, with property-based tests validating correctness properties and checkpoints ensuring stability throughout.

## Tasks

- [x] 1. Set up theme foundation and shared UI components
  - [x] 1.1 Implement dark blue lightning theme in globals.css
    - Replace existing Tailwind theme tokens with the dark blue lightning color palette
    - Define CSS custom properties: --color-background (#0a1628), --color-card (#1e3a5f), --color-primary (#2563eb), --color-accent (#38bdf8), --color-accent-yellow (#fbbf24)
    - Define text colors: --color-foreground (#ffffff), --color-secondary-foreground (#cbd5e1)
    - Add glow utility classes (.glow-blue, .glow-blue-lg) with box-shadow using #38bdf8
    - Ensure WCAG 2.1 AA contrast ratios for text on dark backgrounds
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 1.2 Create LightningBolt decorative SVG component
    - Create `src/components/ui/lightning-bolt.tsx`
    - Render lightning bolt SVG at max opacity 0.15, max dimensions 200×200px
    - Apply pointer-events: none so it does not obstruct interactive elements
    - Accept props for positioning and size variants
    - _Requirements: 1.5_

  - [x] 1.3 Create GlowCard and MetricCard components
    - Create `src/components/ui/glow-card.tsx` with gradient background (dark navy to electric blue) and hover glow effect (max 8px spread)
    - Create `src/components/dashboard/metric-card.tsx` extending GlowCard with title, value, and icon props
    - Apply 200ms ease-in-out CSS transitions for hover/focus/active states
    - _Requirements: 8.2, 8.3_

  - [x] 1.4 Create MemberProfileCard component
    - Create `src/components/dashboard/member-profile-card.tsx`
    - Render member photo (or default avatar placeholder), QR code thumbnail (or placeholder icon), membership status badge, and plan name
    - Handle null avatar_url and null qr_code_url with appropriate placeholders
    - _Requirements: 8.5_

- [x] 2. Database schema extensions and type updates
  - [x] 2.1 Create migration for invitations table and profile extension
    - Create `supabase/migrations/003_gym_modernization.sql`
    - Add `invitation_status` enum type ('sent', 'accepted', 'expired')
    - Create `invitations` table with columns: id, email, full_name, plan_id, token, status, invited_by, expires_at, accepted_at, created_at
    - Add indexes on token, email, and status columns
    - ALTER profiles table to add `qr_code_url TEXT` column
    - Add RLS policies: only admins can manage invitations
    - _Requirements: 2.1, 2.3, 2.6_

  - [x] 2.2 Create storage buckets configuration
    - Document/create `member-photos` and `member-qr-codes` storage buckets
    - Define storage RLS policies: members read own photo, admins/trainers read all, service role for uploads
    - _Requirements: 4.6, 5.2_

  - [x] 2.3 Update TypeScript database types
    - Add `InvitationStatus` type and `Invitation` interface to `src/lib/types/database.ts`
    - Add `qr_code_url` field to Profile Row/Insert/Update types
    - Add invitations table type definitions to Database interface
    - _Requirements: 2.1, 2.3_

- [x] 3. Implement core service modules
  - [x] 3.1 Implement invitation service
    - Create `src/lib/services/invitation.ts`
    - Implement `createInvitation(email, fullName, planId, invitedBy)`: generates unique token, sets 72h expiry, inserts to DB
    - Implement `validateToken(token)`: checks existence, expiry, and used status
    - Implement `listInvitations(page, pageSize)`: paginated list (max 50 per page) with status
    - Implement `resendInvitation(id)`: invalidates old token, generates new one with fresh 72h expiry
    - Implement `markAsAccepted(token)`: updates status to 'accepted' with accepted_at timestamp
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

  - [x]* 3.2 Write property tests for invitation service
    - **Property 1: Invitation token validation** — For any expired, used, or non-existent token, validation rejects with error
    - **Property 2: Admin form input validation** — For any invalid email/name/plan, submission is rejected with field-specific errors
    - **Validates: Requirements 2.3, 2.4, 2.7**

  - [x] 3.3 Implement registration service
    - Create `src/lib/services/registration.ts`
    - Implement `completeRegistration(token, password, phone, emergencyContactName, emergencyContactPhone, photoFile)`: orchestrates full registration flow
    - Validate password (8-72 chars, 1 uppercase, 1 lowercase, 1 number)
    - Validate phone (7-15 digits)
    - Create Supabase Auth user, update profile, upload photo, generate QR, create membership, create payment
    - On failure: display error, retain form data (except password)
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 6.3, 6.5, 6.6_

  - [x]* 3.4 Write property tests for registration service
    - **Property 3: Password validation** — Accepts iff 8-72 chars with uppercase + lowercase + number
    - **Property 4: Phone number validation** — Accepts iff 7-15 digits
    - **Property 8: Registration creates correct membership and payment** — Validates correct plan_id, amount, status, and method
    - **Property 9: Membership date calculation** — start_date = registration date, end_date = start_date + duration_days
    - **Validates: Requirements 3.3, 3.4, 6.3, 6.5, 6.6**

  - [x] 3.5 Implement photo service
    - Create `src/lib/services/photo.ts`
    - Implement `validatePhoto(file)`: checks MIME type (jpeg/png/webp), dimensions (≥200×200), file size (>0 and ≤5MB)
    - Implement `uploadPhoto(memberId, file)`: uploads to Supabase Storage at `member-photos/{member_id}.{extension}`, returns public URL
    - Implement `getPhotoUrl(memberId)`: retrieves stored photo URL
    - _Requirements: 4.1, 4.2, 4.6, 4.7_

  - [x]* 3.6 Write property tests for photo service
    - **Property 5: Photo file validation** — Accepts iff valid MIME type AND ≥200×200 AND >0 bytes AND ≤5MB
    - **Property 6: Photo storage path construction** — Path is exactly `member-photos/{member_id}.{extension}`
    - **Validates: Requirements 4.2, 4.6**

  - [x] 3.7 Implement QR code service
    - Create `src/lib/services/qr.ts`
    - Install `qrcode` and `@types/qrcode` packages
    - Implement `generateQRCode(memberId)`: generates QR code PNG encoding the member's profile UUID
    - Implement `storeQRCode(memberId, qrBuffer)`: uploads to `member-qr-codes/{member_id}.png` in Supabase Storage
    - Implement retry logic: 3 attempts with 2-second delay, queue background job after all failures
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

  - [x]* 3.8 Write property tests for QR code service
    - **Property 7: QR code round-trip encoding** — Generate QR from UUID then decode produces same UUID
    - **Validates: Requirements 5.1**

  - [x] 3.9 Implement membership service
    - Create `src/lib/services/membership.ts`
    - Implement `createMembership(memberId, planId, startDate)`: calculates end_date from plan's duration_days, creates record
    - Implement `checkExpiredMemberships()`: finds active memberships past end_date and updates status to 'expired'
    - _Requirements: 6.5, 6.8_

  - [x]* 3.10 Write property tests for membership service
    - **Property 9: Membership date calculation** — end_date = start_date + duration_days
    - **Property 10: Membership expiry detection** — Active memberships past end_date are detected as expired
    - **Validates: Requirements 6.5, 6.8**

- [x] 4. Checkpoint - Core services validated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement API route handlers
  - [x] 5.1 Implement invitations API routes
    - Create `src/app/api/invitations/route.ts` with POST (create invitation) and GET (list invitations with pagination)
    - Create `src/app/api/invitations/validate/route.ts` with GET (validate token)
    - Create `src/app/api/invitations/[id]/resend/route.ts` with POST (resend expired invitation)
    - Check admin role authorization on all admin endpoints
    - Check for duplicate email on create
    - Trigger invitation email via Supabase Edge Function on successful creation
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2_

  - [x] 5.2 Implement registration API route
    - Create `src/app/api/register/route.ts` with POST handler
    - Validate invitation token, then orchestrate registration via registration service
    - Create Auth user, update profile, upload photo, generate QR, create membership + payment
    - Handle deactivated plans gracefully (assign originally selected plan per Req 6.4)
    - Return structured errors with field identification
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 5.1, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.3 Implement attendance QR check-in API route
    - Create `src/app/api/attendance/qr-check-in/route.ts` with POST handler
    - Validate QR code content is valid UUID and matches existing member
    - Check membership status: reject if expired/frozen/cancelled
    - Check for existing check-in today: update check_out_time if found, else create new record
    - Return member photo, name, and membership status on success
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 5.4 Write property tests for attendance check-in logic
    - **Property 11: Active member QR check-in creates attendance** — Valid member with active status creates new attendance record
    - **Property 12: Non-active membership prevents check-in** — Expired/frozen/cancelled status rejects check-in
    - **Property 13: Duplicate check-in records checkout** — Existing today record gets check_out_time updated
    - **Property 14: Invalid QR code rejection** — Non-UUID or non-matching UUID returns error
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.6**

  - [x] 5.5 Implement QR code generation API route
    - Create `src/app/api/qr/generate/route.ts` with POST handler
    - Accept member ID, generate QR code, store in Storage, update profile qr_code_url
    - Return QR code URL on success
    - _Requirements: 5.1, 5.2_

- [x] 6. Checkpoint - API routes complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement admin pages and member registration flow
  - [x] 7.1 Implement admin Create Member (invitation) page
    - Create `src/app/dashboard/members/invite/page.tsx` and `src/components/members/invitation-form.tsx`
    - Form fields: email (valid format, max 254 chars), full name (1-100 chars), membership plan (dropdown of active plans)
    - Display validation errors per field on invalid submission
    - Show error if email already exists (409 response)
    - On success: display confirmation that invitation was sent
    - _Requirements: 2.1, 2.2, 2.5, 2.7_

  - [x] 7.2 Implement admin Invitations list page
    - Create `src/app/dashboard/members/invitations/page.tsx`
    - Display paginated list (max 50 per page): email, full name, status, creation date, expiry date
    - Add "Resend" action for expired invitations
    - Show registration progress per member: Invited, Email Sent, Registration Complete, Active Member
    - _Requirements: 2.6, 6.7_

  - [x] 7.3 Implement member registration page
    - Create `src/app/(auth)/register/complete/page.tsx` and registration form component
    - Validate invitation token on page load; show error if invalid/expired
    - Pre-fill email from valid invitation
    - Form fields: password (with requirements shown), phone, emergency contact name, emergency contact phone
    - Integrate PhotoUpload component (mandatory)
    - On submit: call registration API, show errors with retained form data (except password)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1_

  - [x] 7.4 Implement PhotoUpload component
    - Create `src/components/registration/photo-upload.tsx`
    - Support file upload (JPEG, PNG, WebP) and live camera capture option
    - Hide camera option if device camera unavailable or permission denied
    - Display photo preview at minimum 150×150px
    - Validate file: format, dimensions ≥200×200, size ≤5MB
    - Show specific validation error messages; retain all other form fields on error
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

  - [x] 7.5 Implement registration success page
    - Create `src/app/(auth)/register/success/page.tsx`
    - Display generated QR code within 5 seconds of account creation
    - Show completion message with LightningBolt decoration
    - If QR unavailable: show "QR code is being generated" with refresh option
    - _Requirements: 5.4, 5.6, 5.7_

- [x] 8. Implement QR-based attendance scanner
  - [x] 8.1 Implement QRScanner component
    - Create `src/components/attendance/qr-scanner.tsx`
    - Install `html5-qrcode` package
    - Implement camera-based QR code scanning
    - On successful decode: call attendance check-in API
    - Handle camera unavailable gracefully (hide scanner, show fallback)
    - _Requirements: 7.1, 7.6_

  - [x] 8.2 Implement QR code attendance page
    - Update `src/app/dashboard/attendance/page.tsx` to integrate QRScanner
    - Display confirmation screen on successful check-in: member photo, name, status for minimum 5 seconds
    - Show warning messages for expired/frozen/cancelled memberships
    - Show "unrecognized code" error and return to scanner in 3 seconds
    - Return to scanner-ready state after confirmation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 8.3 Implement QRCodeDisplay component
    - Create `src/components/ui/qr-code-display.tsx`
    - Render QR code at minimum 200×200px resolution
    - Include download button to save as PNG
    - Show placeholder message if qr_code_url is unavailable with manual refresh option
    - _Requirements: 5.3, 5.7_

- [x] 9. Implement modernized dashboard and navigation
  - [x] 9.1 Update sidebar navigation with dark theme
    - Modify `src/components/dashboard/sidebar.tsx`
    - Apply translucent dark blue background, electric blue active-state indicators
    - Add lightning bolt icons to menu items
    - Apply 200ms ease-in-out transitions on navigation links
    - _Requirements: 8.1, 8.3_

  - [x] 9.2 Implement role-based dashboard pages
    - Update `src/app/dashboard/page.tsx` with role-based rendering
    - Admin dashboard: metric cards for total active members, revenue this month, check-ins today, pending registrations
    - Trainer dashboard: list of upcoming assigned sessions
    - Member dashboard: active membership status and upcoming session bookings
    - Apply responsive grid: 1-col (<768px), 2-col (768-1023px), 4-col (≥1024px)
    - _Requirements: 8.4, 8.6, 8.7, 8.8_

  - [x] 9.3 Update member profile page with QR code display
    - Update `src/app/dashboard/profile/page.tsx`
    - Integrate QRCodeDisplay component showing member's QR code
    - Show download option for QR code PNG
    - _Requirements: 5.3, 5.7_

  - [x]* 9.4 Write property test for MemberProfileCard
    - **Property 15: Member profile card renders available fields** — Renders name + status badge always, photo/placeholder conditional on avatar_url, QR/placeholder conditional on qr_code_url
    - **Validates: Requirements 8.5**

- [x] 10. Integration wiring and final polish
  - [x] 10.1 Wire invitation email sending via Supabase Edge Function
    - Create edge function definition for `send-invitation`
    - Trigger from invitations API on successful creation
    - Include invitation link with token in email body
    - Handle send failure: return error to admin, allow retry
    - _Requirements: 6.1, 6.2_

  - [x] 10.2 Implement membership expiry automation
    - Create utility or cron-compatible function for checking expired memberships
    - Update active memberships past end_date to 'expired' status
    - Wire into application (can be triggered via API route or scheduled task)
    - _Requirements: 6.8_

  - [x] 10.3 Update existing login page and dashboard header with theme
    - Apply dark blue lightning theme to login page with LightningBolt decoration
    - Update dashboard header component with new theme colors
    - Ensure all existing UI components respect new theme tokens
    - _Requirements: 1.3, 1.5_

  - [x] 10.4 Install new dependencies and update package.json
    - Install `qrcode`, `@types/qrcode`, `html5-qrcode`
    - Install `vitest`, `fast-check`, `@testing-library/react` as devDependencies (if not present)
    - Add test script to package.json
    - _Requirements: Design dependencies_

- [x] 11. Final checkpoint - Full integration validated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key integration points
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript throughout with Next.js App Router and Supabase
- Theme implementation uses Tailwind CSS v4 @theme configuration
- QR generation uses client-side `qrcode` library, scanning uses `html5-qrcode`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.3", "10.4"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "3.1"] },
    { "id": 2, "tasks": ["1.4", "3.2", "3.3", "3.5", "3.7", "3.9"] },
    { "id": 3, "tasks": ["3.4", "3.6", "3.8", "3.10"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.5"] },
    { "id": 5, "tasks": ["5.4", "7.1", "7.4"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.1", "8.3"] },
    { "id": 7, "tasks": ["7.5", "8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 9, "tasks": ["10.1", "10.2", "10.3"] }
  ]
}
```
