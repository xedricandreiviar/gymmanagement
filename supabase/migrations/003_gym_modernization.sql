-- Gym Modernization - Invitations table and profile extension
-- Supports: admin-initiated member registration via invitation tokens

-- Create invitation_status enum
CREATE TYPE public.invitation_status AS ENUM ('sent', 'accepted', 'expired');

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  plan_id UUID REFERENCES public.membership_plans(id) ON DELETE RESTRICT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status public.invitation_status DEFAULT 'sent' NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance on invitations
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_status ON public.invitations(status);

-- Extend profiles table with QR code URL
ALTER TABLE public.profiles ADD COLUMN qr_code_url TEXT;

-- Enable Row Level Security on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage invitations
CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (public.get_user_role() = 'admin');
