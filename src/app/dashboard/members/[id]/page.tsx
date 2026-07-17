import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Member Detail — GymFlow" };

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!currentProfile || currentProfile.role !== "admin") redirect("/dashboard");

  const { data: member } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!member) notFound();

  const [
    { data: memberships },
    { data: payments },
    { data: attendance },
  ] = await Promise.all([
    supabase.from("memberships").select("*, membership_plans(*)").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("member_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("attendance").select("*").eq("member_id", id).order("check_in_time", { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/members">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">{member.full_name}</h1>
        <Badge>{member.role}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Phone" value={member.phone || "—"} />
            <InfoRow label="Emergency Contact" value={member.emergency_contact || "—"} />
            <InfoRow label="Health Notes" value={member.health_notes || "—"} />
            <InfoRow label="Joined" value={new Date(member.created_at).toLocaleDateString()} />
          </CardContent>
        </Card>

        {/* Memberships */}
        <Card>
          <CardHeader><CardTitle>Memberships</CardTitle></CardHeader>
          <CardContent>
            {memberships && memberships.length > 0 ? (
              <ul className="space-y-3">
                {memberships.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(m as any).membership_plans?.name}</p>
                      <p className="text-xs text-muted">{m.start_date} → {m.end_date}</p>
                    </div>
                    <Badge variant={m.status === "active" ? "success" : m.status === "expired" ? "destructive" : "warning"}>
                      {m.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No memberships found.</p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <ul className="space-y-3">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">₱{Number(p.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted">{p.method} • {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={p.status === "paid" ? "success" : p.status === "overdue" ? "destructive" : "warning"}>
                      {p.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No payment records.</p>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card>
          <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
          <CardContent>
            {attendance && attendance.length > 0 ? (
              <ul className="space-y-3">
                {attendance.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p className="font-medium">
                      {new Date(a.check_in_time).toLocaleString()}
                    </p>
                    {a.check_out_time && (
                      <p className="text-xs text-muted">Out: {new Date(a.check_out_time).toLocaleString()}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No attendance records.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
