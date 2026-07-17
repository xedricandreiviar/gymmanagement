import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { BookSessionButton } from "./book-session-button";

export const metadata = { title: "Sessions — GymFlow" };

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  // Get booking counts per session
  const sessionIds = sessions?.map((s) => s.id) || [];
  let bookingCounts: Record<string, number> = {};
  let myBookings: string[] = [];

  if (sessionIds.length > 0) {
    const { data: bookings } = await supabase
      .from("session_bookings")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "confirmed");

    if (bookings) {
      for (const b of bookings) {
        bookingCounts[b.session_id] = (bookingCounts[b.session_id] || 0) + 1;
      }
    }

    // Get current user's bookings
    const { data: userBookings } = await supabase
      .from("session_bookings")
      .select("session_id")
      .eq("member_id", profile.id)
      .eq("status", "confirmed")
      .in("session_id", sessionIds);

    myBookings = userBookings?.map((b) => b.session_id) || [];
  }

  const isAdminOrTrainer = profile.role === "admin" || profile.role === "trainer";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        {isAdminOrTrainer && (
          <Link href="/dashboard/sessions/new">
            <Button size="sm"><Plus className="h-4 w-4" /> New Session</Button>
          </Link>
        )}
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const booked = bookingCounts[session.id] || 0;
            const spotsLeft = session.capacity - booked;
            const isBooked = myBookings.includes(session.id);

            return (
              <Card key={session.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{session.title}</h3>
                    {session.recurring && <Badge variant="secondary">Recurring</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar className="h-4 w-4" />
                    <span>{session.date}</span>
                    <span>•</span>
                    <span>{session.start_time} – {session.end_time}</span>
                  </div>
                  {session.description && (
                    <p className="text-sm text-muted">{session.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-sm font-medium ${spotsLeft <= 3 ? "text-warning" : "text-success"}`}>
                      {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}
                    </span>
                    {profile.role === "member" && (
                      <BookSessionButton
                        sessionId={session.id}
                        memberId={profile.id}
                        isBooked={isBooked}
                        isFull={spotsLeft <= 0}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted">No upcoming sessions scheduled.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
