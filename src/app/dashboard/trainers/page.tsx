import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Trainers — GymFlow" };

export default async function TrainersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: trainers } = await supabase
    .from("trainers")
    .select("*, profiles!trainers_profile_id_fkey(full_name, phone, avatar_url)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trainers</h1>

      {trainers && trainers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((trainer) => (
            <Card key={trainer.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {((trainer as any).profiles?.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{(trainer as any).profiles?.full_name}</p>
                    {trainer.specialization && (
                      <p className="text-xs text-muted">{trainer.specialization}</p>
                    )}
                  </div>
                </div>
                {trainer.bio && (
                  <p className="text-sm text-muted">{trainer.bio}</p>
                )}
                {trainer.certifications && trainer.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {trainer.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary">{cert}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted">No trainers registered yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
