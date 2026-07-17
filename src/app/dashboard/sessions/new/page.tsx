import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionForm } from "./session-form";

export const metadata = { title: "New Session — GymFlow" };

export default async function NewSessionPage() {
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

  // Get trainers for assignment
  const { data: trainerProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "trainer");

  return (
    <div className="max-w-2xl mx-auto">
      <SessionForm trainers={trainerProfiles || []} />
    </div>
  );
}
