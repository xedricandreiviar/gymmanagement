import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvitationForm } from "@/components/members/invitation-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Invite Member — GymFlow" };

export default async function InviteMemberPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invite New Member</h1>
        <Link href="/dashboard/members">
          <Button variant="ghost" size="sm">← Back to Members</Button>
        </Link>
      </div>
      <InvitationForm />
    </div>
  );
}
