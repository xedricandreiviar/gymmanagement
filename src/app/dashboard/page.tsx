import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Users, CreditCard, Calendar, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Dashboard — GymFlow" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Admin dashboard
  if (profile.role === "admin") {
    const today = new Date().toISOString().split("T")[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { count: activeMembers },
      { data: monthlyPayments },
      { count: todayAttendance },
      { count: pendingRegistrations },
      { data: upcomingSessions },
    ] = await Promise.all([
      supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("payments")
        .select("amount")
        .gte("created_at", startOfMonth),
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("check_in_time", today),
      supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent"),
      supabase
        .from("sessions")
        .select("*")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5),
    ]);

    const revenueThisMonth = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

        {/* Metric Cards Grid - Responsive: 1-col < 768px, 2-col 768-1023px, 4-col >= 1024px */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="h-6 w-6" />}
            title="Total Active Members"
            value={activeMembers ?? 0}
          />
          <MetricCard
            icon={<CreditCard className="h-6 w-6" />}
            title="Revenue This Month"
            value={`₱${revenueThisMonth.toLocaleString()}`}
          />
          <MetricCard
            icon={<ClipboardCheck className="h-6 w-6" />}
            title="Check-ins Today"
            value={todayAttendance ?? 0}
          />
          <MetricCard
            icon={<Calendar className="h-6 w-6" />}
            title="Pending Registrations"
            value={pendingRegistrations ?? 0}
          />
        </div>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <ul className="divide-y divide-border">
                {upcomingSessions.map((session) => (
                  <li key={session.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-card-foreground">{session.title}</p>
                      <p className="text-xs text-muted">{session.date} • {session.start_time} – {session.end_time}</p>
                    </div>
                    <Badge variant="secondary">{session.capacity} spots</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trainer dashboard
  if (profile.role === "trainer") {
    const { data: mySessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("trainer_id", profile.id)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(10);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Trainer Dashboard</h1>
        <p className="text-muted">Welcome back, {profile.full_name}!</p>
        <Card>
          <CardHeader>
            <CardTitle>My Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {mySessions && mySessions.length > 0 ? (
              <ul className="divide-y divide-border">
                {mySessions.map((session) => (
                  <li key={session.id} className="py-3">
                    <p className="font-medium text-sm text-card-foreground">{session.title}</p>
                    <p className="text-xs text-muted">{session.date} • {session.start_time} – {session.end_time}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No upcoming sessions assigned to you.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Member dashboard
  const [
    { data: membership },
    { data: myBookings },
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("*, membership_plans(*)")
      .eq("member_id", profile.id)
      .eq("status", "active")
      .single(),
    supabase
      .from("session_bookings")
      .select("*, sessions(*)")
      .eq("member_id", profile.id)
      .eq("status", "confirmed")
      .limit(5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Welcome, {profile.full_name}!</h1>

      {/* Membership Status */}
      <Card>
        <CardHeader>
          <CardTitle>My Membership</CardTitle>
        </CardHeader>
        <CardContent>
          {membership ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <span className="text-sm font-medium text-card-foreground">
                  {(membership as any).membership_plans?.name}
                </span>
              </div>
              <p className="text-xs text-muted">
                Valid until {membership.end_date}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">No active membership. Contact an admin to get started.</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {myBookings && myBookings.length > 0 ? (
            <ul className="divide-y divide-border">
              {myBookings.map((booking) => (
                <li key={booking.id} className="py-3">
                  <p className="font-medium text-sm text-card-foreground">
                    {(booking as any).sessions?.title}
                  </p>
                  <p className="text-xs text-muted">
                    {(booking as any).sessions?.date} • {(booking as any).sessions?.start_time}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming bookings. Check available sessions!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
