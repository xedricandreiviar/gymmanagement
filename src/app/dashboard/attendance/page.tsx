import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckInForm } from "./check-in-form";
import { QRAttendance } from "./qr-attendance";

export const metadata = { title: "Attendance — GymFlow" };

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "trainer")) {
    redirect("/dashboard");
  }

  // Today's attendance
  const today = new Date().toISOString().split("T")[0];
  const { data: attendance } = await supabase
    .from("attendance")
    .select("*, profiles!attendance_member_id_fkey(full_name)")
    .gte("check_in_time", today)
    .order("check_in_time", { ascending: false });

  // Get all members for manual check-in fallback
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "member")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      {/* QR Code Scanner */}
      <QRAttendance />

      {/* Manual Check-In Fallback */}
      <CheckInForm members={members || []} />

      {/* Today's Log */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Check-ins ({attendance?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance && attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted">Member</th>
                    <th className="pb-3 font-medium text-muted">Check In</th>
                    <th className="pb-3 font-medium text-muted">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3 font-medium">
                        {(record as any).profiles?.full_name || "Unknown"}
                      </td>
                      <td className="py-3 text-muted">
                        {new Date(record.check_in_time).toLocaleTimeString()}
                      </td>
                      <td className="py-3 text-muted">
                        {record.check_out_time
                          ? new Date(record.check_out_time).toLocaleTimeString()
                          : "—"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">No check-ins today.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
