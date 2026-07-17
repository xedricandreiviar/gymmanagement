-- Row Level Security Policies
-- Enable RLS on all tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user's profile id
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Trainers can view member profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'trainer');

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- MEMBERSHIP_PLANS policies
CREATE POLICY "Anyone can view active plans"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all plans"
  ON public.membership_plans FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage plans"
  ON public.membership_plans FOR ALL
  USING (public.get_user_role() = 'admin');

-- MEMBERSHIPS policies
CREATE POLICY "Members can view their own memberships"
  ON public.memberships FOR SELECT
  USING (member_id = public.get_profile_id());

CREATE POLICY "Admins can view all memberships"
  ON public.memberships FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can manage memberships"
  ON public.memberships FOR ALL
  USING (public.get_user_role() = 'admin');

-- TRAINERS policies
CREATE POLICY "Anyone authenticated can view trainers"
  ON public.trainers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage trainers"
  ON public.trainers FOR ALL
  USING (public.get_user_role() = 'admin');

-- SESSIONS policies
CREATE POLICY "Anyone authenticated can view sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sessions"
  ON public.sessions FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Trainers can manage their own sessions"
  ON public.sessions FOR ALL
  USING (trainer_id = public.get_profile_id() AND public.get_user_role() = 'trainer');

-- SESSION_BOOKINGS policies
CREATE POLICY "Members can view their own bookings"
  ON public.session_bookings FOR SELECT
  USING (member_id = public.get_profile_id());

CREATE POLICY "Members can create their own bookings"
  ON public.session_bookings FOR INSERT
  WITH CHECK (member_id = public.get_profile_id());

CREATE POLICY "Members can cancel their own bookings"
  ON public.session_bookings FOR UPDATE
  USING (member_id = public.get_profile_id());

CREATE POLICY "Admins can view all bookings"
  ON public.session_bookings FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Trainers can view bookings for their sessions"
  ON public.session_bookings FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE trainer_id = public.get_profile_id()
    )
  );

-- ATTENDANCE policies
CREATE POLICY "Members can view their own attendance"
  ON public.attendance FOR SELECT
  USING (member_id = public.get_profile_id());

CREATE POLICY "Admins can manage attendance"
  ON public.attendance FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Trainers can manage attendance"
  ON public.attendance FOR ALL
  USING (public.get_user_role() = 'trainer');

-- PAYMENTS policies
CREATE POLICY "Members can view their own payments"
  ON public.payments FOR SELECT
  USING (member_id = public.get_profile_id());

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.get_user_role() = 'admin');
