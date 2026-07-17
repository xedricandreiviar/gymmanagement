import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { ProfileQRSection } from "./profile-qr-section";

export const metadata = { title: "My Profile — GymFlow" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <ProfileForm profile={profile} />
      <ProfileQRSection
        qrCodeUrl={profile.qr_code_url}
        memberName={profile.full_name}
        profileId={profile.id}
      />
    </div>
  );
}
